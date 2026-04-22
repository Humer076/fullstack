import pool from '../db/pool.js';

export const seedDatabase = async (req, res) => {
  try {
    console.log('Seeding database with dummy data...');

    // 1. Clear existing data
    await pool.query('TRUNCATE TABLE users, batches, batch_trainers, batch_students, sessions, attendance, invite_tokens RESTART IDENTITY CASCADE');

    // 2. Insert Users
    const usersData = [
      ['dev_student', 'Dev Student', 'student@example.com', 'student', null],
      ['dev_trainer', 'Dev Trainer', 'trainer@example.com', 'trainer', null],
      ['dev_inst', 'Dev Institution', 'inst@example.com', 'institution', null],
      ['dev_mgr', 'Dev Manager', 'manager@example.com', 'programme_manager', null],
      ['dev_officer', 'Dev Officer', 'officer@example.com', 'monitoring_officer', null],
    ];

    const users = [];
    for (const [clerk_id, name, email, role, inst_id] of usersData) {
      const result = await pool.query(
        `INSERT INTO users (clerk_user_id, name, email, role, institution_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id, role`,
        [clerk_id, name, email, role, inst_id]
      );
      users.push(result.rows[0]);
    }

    const getUserId = (role) => users.find(u => u.role === role).id;
    const instId = getUserId('institution');
    const trainerId = getUserId('trainer');
    const studentId = getUserId('student');

    // 3. Insert Batch
    const batchResult = await pool.query(
      `INSERT INTO batches (name, institution_id) VALUES ($1, $2) RETURNING id`,
      ['Web Development Bootcamp', instId]
    );
    const batchId = batchResult.rows[0].id;

    // 4. Assign Trainer to Batch
    await pool.query(
      `INSERT INTO batch_trainers (batch_id, trainer_id) VALUES ($1, $2)`,
      [batchId, trainerId]
    );

    // 5. Assign Student to Batch
    await pool.query(
      `INSERT INTO batch_students (batch_id, student_id) VALUES ($1, $2)`,
      [batchId, studentId]
    );

    // 6. Create Sessions
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionResult1 = await pool.query(
      `INSERT INTO sessions (batch_id, trainer_id, title, description, date, start_time, end_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [batchId, trainerId, 'Intro to HTML', 'Basic HTML concepts', today.toISOString().split('T')[0], '10:00', '12:00']
    );
    const sessionId1 = sessionResult1.rows[0].id;

    const sessionResult2 = await pool.query(
      `INSERT INTO sessions (batch_id, trainer_id, title, description, date, start_time, end_time) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [batchId, trainerId, 'Intro to CSS', 'Basic CSS concepts', tomorrow.toISOString().split('T')[0], '14:00', '16:00']
    );
    const sessionId2 = sessionResult2.rows[0].id;

    // 7. Add Attendance
    await pool.query(
      `INSERT INTO attendance (session_id, student_id, status) VALUES ($1, $2, $3)`,
      [sessionId1, studentId, 'present']
    );
    await pool.query(
      `INSERT INTO attendance (session_id, student_id, status) VALUES ($1, $2, $3)`,
      [sessionId2, studentId, 'late']
    );

    console.log('Database seeded successfully!');
    return res.json({ success: true, message: 'Database seeded with dummy data!' });

  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seed failed', details: error.message });
  }
};
