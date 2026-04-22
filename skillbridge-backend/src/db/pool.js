import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { URL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const url = new URL(connectionString);

const pool = new Pool({
  user: url.username,
  password: url.password,
  host: url.hostname,
  port: url.port || 5432,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// ✅ ADD DB QUERY LOGGING
const originalQuery = pool.query;
pool.query = function (...args) {
  const queryText = typeof args[0] === 'object' ? args[0].text : args[0];
  console.log(`[DB Query] ${queryText.substring(0, 150).replace(/\n/g, ' ')}...`);
  return originalQuery.apply(pool, args);
};

export default pool;
