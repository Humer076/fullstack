import pkg from '@clerk/backend';
const { clerkClient } = pkg;

import pool from '../db/pool.js';
import { getUserByClerkId as getUserMemory } from '../db/memoryStore.js';

/**
 * Middleware to verify Clerk JWT and attach user info to request
 */
export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ DEV MODE: allow x-clerk-user
    const devClerkUser = req.headers['x-clerk-user'] || req.query?.dev_user_id;

    if (process.env.NODE_ENV !== 'production' && devClerkUser) {
      console.log('verifyAuth → using dev user:', devClerkUser);

      try {
        const userResult = await pool.query(
          `SELECT id, clerk_user_id, name, email, role, institution_id FROM users WHERE clerk_user_id = $1`,
          [devClerkUser]
        );

        if (userResult.rows.length > 0) {
          req.user = userResult.rows[0];
          return next();
        }
      } catch (dbErr) {
        console.warn('DB error, checking memory store');
      }

      const memUser = getUserMemory(devClerkUser);
      if (memUser) {
        req.user = memUser;
        return next();
      }

      return res.status(401).json({ error: 'Dev user not found' });
    }

    // ✅ Production auth
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    let session;
    try {
      session = await clerkClient.verifyToken(token);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const clerkUserId = session.sub;

    const userResult = await pool.query(
      `SELECT id, clerk_user_id, name, email, role, institution_id FROM users WHERE clerk_user_id = $1`,
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

/**
 * Role-based access control middleware
 */
export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // ✅ FIX: use DB role OR fallback to header
      const roleFromDB = req.user?.role;
      const roleFromHeader = req.headers['x-role'];

      const role = roleFromDB || roleFromHeader;

      console.log('Authorize check → DB:', roleFromDB, '| Header:', roleFromHeader, '| Final:', role);

      if (!role) {
        return res.status(401).json({
          error: 'No role found',
        });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Requires one of: ${allowedRoles.join(', ')}`,
          currentRole: role,
        });
      }

      next();
    } catch (error) {
      console.error('Authorize error:', error);
      return res.status(500).json({
        error: 'Authorization failed',
        details: error.message,
      });
    }
  };
};

/**
 * Validate institution access
 */
export const validateInstitutionAccess = async (req, res, next) => {
  try {
    const { institutionId } = req.params;

    if (['programme_manager', 'monitoring_officer'].includes(req.user.role)) {
      return next();
    }

    if (req.user.role === 'institution' && req.user.id === parseInt(institutionId)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden: Cannot access this institution' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Validate batch access
 */
export const validateBatchAccess = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batchResult = await pool.query(
      `SELECT institution_id FROM batches WHERE id = $1`,
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const batch = batchResult.rows[0];

    if (req.user.role === 'trainer') {
      const trainerAccess = await pool.query(
        `SELECT 1 FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
        [batchId, req.user.id]
      );

      if (trainerAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Not assigned to this batch' });
      }
    } else if (req.user.role === 'institution') {
      if (req.user.id !== batch.institution_id) {
        return res.status(403).json({ error: 'Batch does not belong to your institution' });
      }
    } else if (!['programme_manager', 'monitoring_officer'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.batch = batch;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  verifyAuth,
  authorize,
  validateInstitutionAccess,
  validateBatchAccess,
};