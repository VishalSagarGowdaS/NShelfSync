import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

// Configure Aiven PostgreSQL connection pool
let pool: pg.Pool | null = null;
let isConnected = false;

export function getDbPool(): pg.Pool {
  if (!pool) {
    if (env.DATABASE_URL) {
      pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: env.DATABASE_URL.includes('sslmode=require') || env.PG_SSL ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } else if (env.PG_HOST && env.PG_PASSWORD) {
      pool = new Pool({
        host: env.PG_HOST,
        port: env.PG_PORT,
        database: env.PG_DATABASE,
        user: env.PG_USER,
        password: env.PG_PASSWORD,
        ssl: env.PG_SSL ? { rejectUnauthorized: false } : undefined,
        max: 20,
      });
    } else {
      // Provide an unconfigured pool handle
      pool = new Pool({
        connectionString: 'postgres://avnadmin:unconfigured@localhost:5432/defaultdb',
        connectionTimeoutMillis: 2000,
      });
    }

    pool.on('error', (err) => {
      console.error('[PostgreSQL Error] Unexpected error on idle client:', err.message);
    });
  }
  return pool;
}

export async function testDbConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  try {
    const currentPool = getDbPool();
    const res = await currentPool.query('SELECT version();');
    isConnected = true;
    console.log('[PostgreSQL] Connected to Aiven PostgreSQL successfully.');
    return { connected: true, version: res.rows[0].version };
  } catch (err: any) {
    isConnected = false;
    const msg = err?.message || 'Database connection error';
    console.warn(`[PostgreSQL] Connection check notice: ${msg}`);
    console.warn('[PostgreSQL] Provide Aiven PostgreSQL credentials in .env (DATABASE_URL) for live operations.');
    return { connected: false, error: msg };
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const currentPool = getDbPool();
  return currentPool.query<T>(text, params);
}

export async function getClient() {
  const currentPool = getDbPool();
  return currentPool.connect();
}
