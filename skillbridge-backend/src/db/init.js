import pool from './pool.js';

const initDatabase = async () => {
  try {
    console.log('Initializing database schema...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'trainer', 'institution', 'programme_manager', 'monitoring_officer')),
        institution_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create batches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        institution_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (institution_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create batch_trainers junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batch_trainers (
        batch_id INTEGER NOT NULL,
        trainer_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (batch_id, trainer_id),
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create batch_students junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS batch_students (
        batch_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (batch_id, student_id),
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        batch_id INTEGER NOT NULL,
        trainer_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create attendance table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
        marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(session_id, student_id),
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create invite_tokens table for batch join links
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invite_tokens (
        id SERIAL PRIMARY KEY,
        batch_id INTEGER NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        used_count INTEGER DEFAULT 0,
        max_uses INTEGER,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes for better query performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
      CREATE INDEX IF NOT EXISTS idx_batches_institution ON batches(institution_id);
      CREATE INDEX IF NOT EXISTS idx_batch_students_student ON batch_students(student_id);
      CREATE INDEX IF NOT EXISTS idx_batch_trainers_trainer ON batch_trainers(trainer_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_batch ON sessions(batch_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON sessions(trainer_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
      CREATE INDEX IF NOT EXISTS idx_invite_tokens_batch ON invite_tokens(batch_id);
      CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);
    `);

    console.log('✓ Database schema initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database initialization error:', error);
    process.exit(1);
  }
};

initDatabase();
