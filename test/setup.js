import { query, pool } from '../src/db/pool.js';
import { migrate } from '../src/db/migrate.js';

let migrated = false;

export async function setupDatabase() {
  if (!migrated) {
    await migrate();
    migrated = true;
  }
}

export async function cleanDatabase() {
  await query('DELETE FROM tbl_wl_webhooks');
  await query('DELETE FROM tbl_wl_endpoints');
  await query('DELETE FROM tbl_wl_sessions');
  await query('DELETE FROM tbl_wl_users');
}

export async function closeDatabase() {
  await pool.end();
}

export { query };
