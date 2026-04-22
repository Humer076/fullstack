import pool from '../db/pool.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new batch
 * Allowed roles: trainer, institution
 */
export const createBatch = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Batch name is required' });
    }

    let institutionId;
    if (req.user.role === 'trainer') {
      // Trainer can only create batch for their institution
      institutionId = req.user.institution_id;
      if (!institutionId) {
        return res.status(400).json({ error: 'Trainer must be assigned to an institution' });
      }
    } else if (req.user.role === 'institution') {
      institutionId = req.user.id;
    }

    const result = await pool.query(
      `INSERT INTO batches (name, institution_id) VALUES ($1, $2) RETURNING *`,
      [name, institutionId]
    );

    return res.status(201).json({
      message: 'Batch created successfully',
      batch: result.rows[0],
    });
  } catch (error) {
    console.error('Create batch error:', error);
    return res.status(500).json({ error: 'Failed to create batch', details: error.message });
  }
};

/**
 * Get all batches for an institution
 * Allowed roles: institution, trainer (their own)
 */
export const getBatches = async (req, res) => {
  try {
    // Development: fallback if req.user not populated by middleware
    if (!req.user && process.env.NODE_ENV !== 'production') {
      const devClerk = req.headers['x-clerk-user'] || req.query?.dev_user_id;
      if (devClerk) {
        try {
          const mem = await import('../db/memoryStore.js');
          const memUser = mem.getUserByClerkId(devClerk);
          if (memUser) req.user = memUser;
        } catch (e) {
          // ignore
        }
      }
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let query = 'SELECT id, name, institution_id, created_at FROM batches';
    let params = [];

    // Students should get empty array (not batches - they join via invite tokens)
    if (req.user.role === 'student') {
      return res.json({ batches: [] });
    }

    if (req.user.role === 'institution') {
      query += ' WHERE institution_id = $1';
      params = [req.user.id];
    } else if (req.user.role === 'trainer') {
      query += ' WHERE institution_id = $1';
      params = [req.user.institution_id];
    } else {
      // Other roles get empty
      return res.json({ batches: [] });
    }

    const result = await pool.query(query, params);
    return res.json({ batches: result.rows });
  } catch (error) {
    console.error('Get batches error:', error);
    // Never return 500 to frontend for empty states
    return res.json({ batches: [] });
  }
};

/**
 * Get batch details with trainers and students count
 */
export const getBatchDetails = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batchResult = await pool.query(
      `SELECT id, name, institution_id, created_at FROM batches WHERE id = $1`,
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = batchResult.rows[0];

    // Verify access
    if (req.user.role === 'trainer' && req.user.institution_id !== batch.institution_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (req.user.role === 'institution' && req.user.id !== batch.institution_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get trainers
    const trainersResult = await pool.query(
      `SELECT u.id, u.name FROM users u 
       JOIN batch_trainers bt ON u.id = bt.trainer_id 
       WHERE bt.batch_id = $1`,
      [batchId]
    );

    // Get student count and details
    const studentsResult = await pool.query(
      `SELECT u.id, u.name, u.email FROM users u 
       JOIN batch_students bs ON u.id = bs.student_id 
       WHERE bs.batch_id = $1`,
      [batchId]
    );

    return res.json({
      batch: {
        ...batch,
        trainers: trainersResult.rows,
        students: studentsResult.rows,
        studentCount: studentsResult.rows.length,
      },
    });
  } catch (error) {
    console.error('Get batch details error:', error);
    return res.status(500).json({ error: 'Failed to fetch batch details', details: error.message });
  }
};

/**
 * Generate invite link for a batch
 * Allowed roles: trainer
 */
export const generateInviteLink = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { maxUses } = req.body; // Optional: max number of times token can be used

    // Verify batch exists and user has access
    const batchResult = await pool.query(
      `SELECT id, institution_id FROM batches WHERE id = $1`,
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = batchResult.rows[0];

    // Verify trainer has access
    if (req.user.role === 'trainer') {
      const trainerAccess = await pool.query(
        `SELECT 1 FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
        [batchId, req.user.id]
      );
      if (trainerAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You are not assigned to this batch' });
      }
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await pool.query(
      `INSERT INTO invite_tokens (batch_id, token, created_by, expires_at, max_uses) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [batchId, token, req.user.id, expiresAt, maxUses || null]
    );

    const inviteLink = `${process.env.FRONTEND_URL}/join-batch?token=${token}`;

    return res.status(201).json({
      message: 'Invite link generated successfully',
      inviteLink,
      token: result.rows[0],
    });
  } catch (error) {
    console.error('Generate invite link error:', error);
    return res.status(500).json({ error: 'Failed to generate invite link', details: error.message });
  }
};

/**
 * Join a batch using invite token
 * Allowed roles: student
 */
export const joinBatch = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    // Verify token
    const tokenResult = await pool.query(
      `SELECT * FROM invite_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite token' });
    }

    const inviteToken = tokenResult.rows[0];

    // Check max uses
    if (inviteToken.max_uses && inviteToken.used_count >= inviteToken.max_uses) {
      return res.status(400).json({ error: 'Invite link has reached maximum uses' });
    }

    const batchId = inviteToken.batch_id;

    // Check if already joined
    const alreadyJoined = await pool.query(
      `SELECT 1 FROM batch_students WHERE batch_id = $1 AND student_id = $2`,
      [batchId, req.user.id]
    );

    if (alreadyJoined.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a member of this batch' });
    }

    // Add student to batch
    await pool.query(
      `INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2)`,
      [batchId, req.user.id]
    );

    // Increment used_count
    await pool.query(
      `UPDATE invite_tokens SET used_count = used_count + 1 WHERE id = $1`,
      [inviteToken.id]
    );

    // Get batch details
    const batchDetails = await pool.query(
      `SELECT id, name FROM batches WHERE id = $1`,
      [batchId]
    );

    return res.status(200).json({
      message: 'Successfully joined batch',
      batch: batchDetails.rows[0],
    });
  } catch (error) {
    console.error('Join batch error:', error);
    return res.status(500).json({ error: 'Failed to join batch', details: error.message });
  }
};

export default {
  createBatch,
  getBatches,
  getBatchDetails,
  generateInviteLink,
  joinBatch,
};
