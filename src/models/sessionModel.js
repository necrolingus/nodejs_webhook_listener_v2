import { query } from '../db/pool.js';

export async function createSession(userId, sessionToken, expiresAt) {
  const result = await query(
    'INSERT INTO tbl_wl_sessions (user_id, session_token, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, sessionToken, expiresAt]
  );
  return result.rows[0];
}

export async function findSessionByToken(token) {
  const result = await query(
    `SELECT s.*, u.id AS uid, u.recovery_token, u.display_name, u.created_at AS user_created_at
     FROM tbl_wl_sessions s
     JOIN tbl_wl_users u ON s.user_id = u.id
     WHERE s.session_token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  if (!result.rows[0]) return null;
  const row = result.rows[0];
  return {
    session: { id: row.id, user_id: row.user_id, session_token: row.session_token, expires_at: row.expires_at, created_at: row.created_at },
    user: { id: row.uid, recovery_token: row.recovery_token, display_name: row.display_name, created_at: row.user_created_at },
  };
}

export async function deleteSession(sessionToken) {
  const result = await query(
    'DELETE FROM tbl_wl_sessions WHERE session_token = $1',
    [sessionToken]
  );
  return result.rowCount;
}

export async function deleteExpiredSessions() {
  const result = await query('DELETE FROM tbl_wl_sessions WHERE expires_at < NOW()');
  return result.rowCount;
}
