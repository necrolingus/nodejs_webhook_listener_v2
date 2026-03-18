import { query } from '../db/pool.js';

export async function createUser(recoveryToken) {
  const result = await query(
    'INSERT INTO tbl_wl_users (recovery_token) VALUES ($1) RETURNING *',
    [recoveryToken]
  );
  return result.rows[0];
}

export async function findUserById(id) {
  const result = await query('SELECT * FROM tbl_wl_users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function findUserByRecoveryToken(token) {
  const result = await query(
    'SELECT * FROM tbl_wl_users WHERE recovery_token = $1',
    [token]
  );
  return result.rows[0] || null;
}

export async function updateDisplayName(userId, name) {
  const result = await query(
    'UPDATE tbl_wl_users SET display_name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name, userId]
  );
  return result.rows[0] || null;
}
