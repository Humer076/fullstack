import pool from '../db/pool.js';
import { saveUser as saveUserMemory, getUserByClerkId } from '../db/memoryStore.js';
import pkg from '@clerk/backend';
const { clerkClient } = pkg;

/**
 * Sync or create user from Clerk webhook
 */
export const syncUser = async (req, res) => {
  try {
    console.log('Incoming /users/sync request headers:', req.headers);
    console.log('Incoming /users/sync request body:', req.body);
    const { clerkUserId, name, email, role, institutionId } = req.body;

    if (!clerkUserId || !name || !email || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: clerkUserId, name, email, role' 
      });
    }

    const validRoles = ['student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Check if user already exists
    let user;
    try {
      const existingUser = await pool.query(
        `SELECT id FROM users WHERE clerk_user_id = $1`,
        [clerkUserId]
      );

      if (existingUser.rows.length > 0) {
        // Update existing user
        const result = await pool.query(
          `UPDATE users SET name = $1, email = $2, role = $3, institution_id = $4, updated_at = CURRENT_TIMESTAMP
           WHERE clerk_user_id = $5
           RETURNING id, clerk_user_id, name, email, role, institution_id, created_at`,
          [name, email, role, institutionId || null, clerkUserId]
        );
        user = result.rows[0];
      } else {
        // Create new user
        const result = await pool.query(
          `INSERT INTO users (clerk_user_id, name, email, role, institution_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, clerk_user_id, name, email, role, institution_id, created_at`,
          [clerkUserId, name, email, role, institutionId || null]
        );
        user = result.rows[0];
      }

      // DB is accessible, try to update Clerk metadata
      try {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: { role }
        });
        console.log('Updated Clerk publicMetadata for', clerkUserId);
      } catch (clerkErr) {
        console.warn('Failed to update Clerk publicMetadata:', clerkErr?.message || clerkErr);
      }
    } catch (dbErr) {
      // If DB is unreachable (development), fall back to in-memory store
      console.warn('DB error in syncUser, using in-memory fallback:', dbErr.message);
      const existing = getUserByClerkId(clerkUserId);
      if (existing) {
        user = { ...existing, name, email, role, institution_id: institutionId || null };
      } else {
        user = {
          id: Date.now(),
          clerk_user_id: clerkUserId,
          name,
          email,
          role,
          institution_id: institutionId || null,
          created_at: new Date().toISOString(),
        };
      }

      // Save to in-memory store for subsequent requests
      saveUserMemory(user);

      // Try to update Clerk public metadata so the frontend sees the role
      try {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: { role }
        });
        console.log('Updated Clerk publicMetadata for', clerkUserId);
      } catch (clerkErr) {
        console.warn('Failed to update Clerk publicMetadata:', clerkErr?.message || clerkErr);
      }
    }

    return res.status(200).json({
      message: 'User synced successfully',
      user,
    });
  } catch (error) {
    console.error('Sync user error:', error);
    return res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (req, res) => {
  try {
    // If req.user is already populated (via middleware), return it
    if (req.user) {
      return res.json({ user: req.user });
    }

    // Development fallback: allow x-clerk-user header to fetch user from DB or memory
    const devClerk = req.headers['x-clerk-user'] || req.query?.dev_user_id;
    if (process.env.NODE_ENV !== 'production' && devClerk) {
      try {
        // Try DB first
        const dbRes = await pool.query(
          `SELECT id, clerk_user_id, name, email, role, institution_id FROM users WHERE clerk_user_id = $1`,
          [devClerk]
        );
        if (dbRes.rows.length > 0) {
          return res.json({ user: dbRes.rows[0] });
        }
      } catch (dbErr) {
        console.warn('getCurrentUser: DB error, checking memory store', dbErr.message);
      }

      // Check in-memory fallback
      try {
        const mem = await import('../db/memoryStore.js');
        const memUser = mem.getUserByClerkId(devClerk);
        if (memUser) return res.json({ user: memUser });
      } catch (memErr) {
        console.warn('getCurrentUser: memory store error', memErr?.message || memErr);
      }

      return res.status(404).json({ error: 'Dev user not found' });
    }

    return res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
};

/**
 * Assign trainer to batch
 * Allowed roles: institution
 */
export const assignTrainerToBatch = async (req, res) => {
  try {
    const { batchId, trainerId } = req.body;

    if (!batchId || !trainerId) {
      return res.status(400).json({ error: 'Missing required fields: batchId, trainerId' });
    }

    // Verify batch belongs to institution
    const batchResult = await pool.query(
      `SELECT id, institution_id FROM batches WHERE id = $1`,
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    if (batchResult.rows[0].institution_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: Batch does not belong to your institution' });
    }

    // Verify trainer exists and belongs to institution
    const trainerResult = await pool.query(
      `SELECT id FROM users WHERE id = $1 AND role = 'trainer' AND institution_id = $2`,
      [trainerId, req.user.id]
    );

    if (trainerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trainer not found in your institution' });
    }

    // Assign trainer to batch
    await pool.query(
      `INSERT INTO batch_trainers (batch_id, trainer_id) VALUES ($1, $2)
       ON CONFLICT (batch_id, trainer_id) DO NOTHING`,
      [batchId, trainerId]
    );

    return res.status(200).json({
      message: 'Trainer assigned to batch successfully',
    });
  } catch (error) {
    console.error('Assign trainer error:', error);
    return res.status(500).json({ error: 'Failed to assign trainer', details: error.message });
  }
};

/**
 * Get all institutions (for programme manager)
 */
export const getInstitutions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at FROM users WHERE role = 'institution' ORDER BY name ASC`
    );

    return res.json({ institutions: result.rows });
  } catch (error) {
    console.error('Get institutions error:', error);
    return res.status(500).json({ error: 'Failed to fetch institutions', details: error.message });
  }
};

/**
 * Get all trainers for an institution
 * Allowed roles: institution
 */
export const getInstitutionTrainers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at FROM users 
       WHERE role = 'trainer' AND institution_id = $1
       ORDER BY name ASC`,
      [req.user.id]
    );

    return res.json({ trainers: result.rows });
  } catch (error) {
    console.error('Get trainers error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainers', details: error.message });
  }
};

export default {
  syncUser,
  getCurrentUser,
  assignTrainerToBatch,
  getInstitutions,
  getInstitutionTrainers,
};
