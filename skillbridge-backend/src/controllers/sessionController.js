import pool from '../db/pool.js';

/**
 * Create a session
 * Allowed roles: trainer
 */
export const createSession = async (req, res) => {
  try {
    const { batchId, title, description, date, startTime, endTime } = req.body;

    // Validate required fields
    if (!batchId || !title || !date || !startTime || !endTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: batchId, title, date, startTime, endTime' 
      });
    }

    // Verify batch exists and user has access
    const batchResult = await pool.query(
      `SELECT id FROM batches WHERE id = $1`,
      [batchId]
    );

    if (batchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Verify trainer has access to this batch
    const trainerAccess = await pool.query(
      `SELECT 1 FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
      [batchId, req.user.id]
    );

    if (trainerAccess.rows.length === 0) {
      return res.status(403).json({ error: 'Forbidden: You are not assigned to this batch' });
    }

    const result = await pool.query(
      `INSERT INTO sessions (batch_id, trainer_id, title, description, date, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [batchId, req.user.id, title, description || null, date, startTime, endTime]
    );

    return res.status(201).json({
      message: 'Session created successfully',
      session: result.rows[0],
    });
  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
};

/**
 * Get active sessions for a student
 */
export const getStudentSessions = async (req, res) => {
  try {
    // Development: accept dev header to set req.user if auth middleware didn't
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
    const result = await pool.query(
      `SELECT DISTINCT s.id, s.title, s.description, s.date, s.start_time, s.end_time, 
              b.id as batch_id, b.name as batch_name, u.name as trainer_name,
              (SELECT status FROM attendance WHERE session_id = s.id AND student_id = $1) as attendance_status
       FROM sessions s
       JOIN batches b ON s.batch_id = b.id
       JOIN batch_students bs ON b.id = bs.batch_id
       JOIN users u ON s.trainer_id = u.id
       WHERE bs.student_id = $1 AND s.date >= CURRENT_DATE
       ORDER BY s.date ASC, s.start_time ASC`,
      [req.user.id]
    );

    return res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Get student sessions error:', error);
    // Never return 500 to frontend for empty states
    return res.json({ sessions: [] });
  }
};

/**
 * Get sessions for a trainer
 */
export const getTrainerSessions = async (req, res) => {
  try {
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

    const result = await pool.query(
      `SELECT s.id, s.title, s.description, s.date, s.start_time, s.end_time, 
              b.id as batch_id, b.name as batch_name,
              (SELECT COUNT(*) FROM batch_students WHERE batch_id = b.id) as student_count,
              (SELECT COUNT(*) FROM attendance WHERE session_id = s.id AND status = 'present') as present_count
       FROM sessions s
       JOIN batches b ON s.batch_id = b.id
       WHERE s.trainer_id = $1
       ORDER BY s.date DESC, s.start_time DESC`,
      [req.user.id]
    );

    return res.json({ sessions: result.rows });
  } catch (error) {
    console.error('Get trainer sessions error:', error);
    // Never return 500 to frontend for empty states
    return res.json({ sessions: [] });
  }
};

/**
 * Get session details with attendance info
 */
export const getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionResult = await pool.query(
      `SELECT s.id, s.title, s.description, s.date, s.start_time, s.end_time, s.batch_id, s.trainer_id,
              b.name as batch_name, u.name as trainer_name
       FROM sessions s
       JOIN batches b ON s.batch_id = b.id
       JOIN users u ON s.trainer_id = u.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify access
    if (req.user.role === 'trainer' && session.trainer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get attendance data
    const attendanceResult = await pool.query(
      `SELECT a.id, a.student_id, a.status, a.marked_at, u.name, u.email
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.session_id = $1
       ORDER BY u.name ASC`,
      [sessionId]
    );

    // Get all enrolled students
    const studentsResult = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM users u
       JOIN batch_students bs ON u.id = bs.student_id
       WHERE bs.batch_id = $1
       ORDER BY u.name ASC`,
      [session.batch_id]
    );

    return res.json({
      session,
      attendance: attendanceResult.rows,
      enrolledStudents: studentsResult.rows,
    });
  } catch (error) {
    console.error('Get session details error:', error);
    return res.status(500).json({ error: 'Failed to fetch session details', details: error.message });
  }
};

/**
 * Mark attendance for a session
 * Allowed roles: student, trainer
 */
export const markAttendance = async (req, res) => {
  try {
    const { sessionId, studentId, status } = req.body;

    if (!sessionId || !studentId || !status) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, studentId, status' 
      });
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: present, absent, or late' });
    }

    // Verify session exists
    const sessionResult = await pool.query(
      `SELECT id, batch_id FROM sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Students can only mark their own attendance
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Forbidden: Cannot mark attendance for other students' });
    }

    // Trainers can only mark for their sessions
    if (req.user.role === 'trainer') {
      const isSessionTrainer = await pool.query(
        `SELECT 1 FROM sessions WHERE id = $1 AND trainer_id = $2`,
        [sessionId, req.user.id]
      );
      if (isSessionTrainer.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: You did not create this session' });
      }
    }

    // Verify student is enrolled in the batch
    const enrollmentResult = await pool.query(
      `SELECT 1 FROM batch_students WHERE batch_id = $1 AND student_id = $2`,
      [session.batch_id, studentId]
    );

    if (enrollmentResult.rows.length === 0) {
      return res.status(400).json({ error: 'Student is not enrolled in this batch' });
    }

    // Insert or update attendance
    const result = await pool.query(
      `INSERT INTO attendance (session_id, student_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, student_id) DO UPDATE 
       SET status = $3, marked_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [sessionId, studentId, status]
    );

    return res.status(200).json({
      message: 'Attendance marked successfully',
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Failed to mark attendance', details: error.message });
  }
};

/**
 * Get attendance for a session
 * Allowed roles: trainer
 */
export const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists and trainer has access
    const sessionResult = await pool.query(
      `SELECT id, trainer_id, batch_id FROM sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify trainer
    if (session.trainer_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: This is not your session' });
    }

    const result = await pool.query(
      `SELECT a.id, a.student_id, a.status, a.marked_at, u.name, u.email
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       WHERE a.session_id = $1
       ORDER BY u.name ASC`,
      [sessionId]
    );

    return res.json({ attendance: result.rows });
  } catch (error) {
    console.error('Get session attendance error:', error);
    return res.status(500).json({ error: 'Failed to fetch attendance', details: error.message });
  }
};

export default {
  createSession,
  getStudentSessions,
  getTrainerSessions,
  getSessionDetails,
  markAttendance,
  getSessionAttendance,
};
