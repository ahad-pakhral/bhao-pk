import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let dbAvailable = true;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/bhaopk',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err.message);
  dbAvailable = false;
});

// Test connection on startup (non-blocking)
pool.query('SELECT 1').then(() => {
  dbAvailable = true;
  console.log('PostgreSQL connected');
}).catch((err) => {
  dbAvailable = false;
  console.warn('PostgreSQL not available — auth, alerts, wishlist disabled. Search still works.');
});

export function isDbAvailable(): boolean {
  return dbAvailable;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`Slow query (${duration}ms):`, text.slice(0, 100));
  }
  return result;
}
