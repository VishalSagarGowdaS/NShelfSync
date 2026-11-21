import fs from 'fs';
import path from 'path';
import { getDbPool, testDbConnection } from './db.js';

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
  console.log('[Migration] Testing connection to PostgreSQL...');
  const conn = await testDbConnection();
  if (!conn.connected) {
    const errorMsg = `Cannot execute database migrations: PostgreSQL is unreachable (${conn.error}). Please verify DATABASE_URL in .env.`;
    console.warn(`[Migration] ${errorMsg}`);
    return { success: false, message: errorMsg };
  }

  const pool = getDbPool();
  const migrationPath = path.resolve(process.cwd(), '../database/migrations/001_initial_schema.sql');
  const fallbackPath = path.resolve(process.cwd(), 'database/migrations/001_initial_schema.sql');
  
  const filePath = fs.existsSync(migrationPath) ? migrationPath : fallbackPath;
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found at ${filePath}`);
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`[Migration] Executing migration from: ${filePath}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('[Migration] All 21 tables, indexes, and constraints migrated successfully!');
    return { success: true, message: 'All tables migrated successfully' };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[Migration] Migration failed:', error);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
}

// Allow standalone execution
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  runMigrations()
    .then((res) => {
      console.log('[Migration Result]', res);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
