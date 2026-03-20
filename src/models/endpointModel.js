import { query } from '../db/pool.js';

export async function createEndpoint(userId, endpointKey, label, responseCode = 200, responseBody = null) {
  const result = await query(
    'INSERT INTO tbl_wl_endpoints (user_id, endpoint_key, label, response_code, response_body) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, endpointKey, label || null, responseCode, responseBody || null]
  );
  return result.rows[0];
}

export async function updateEndpointResponse(endpointKey, userId, responseCode, responseBody) {
  const result = await query(
    'UPDATE tbl_wl_endpoints SET response_code = $1, response_body = $2 WHERE endpoint_key = $3 AND user_id = $4 RETURNING *',
    [responseCode, responseBody || null, endpointKey, userId]
  );
  return result.rows[0] || null;
}

export async function findEndpointByKey(key) {
  const result = await query(
    'SELECT * FROM tbl_wl_endpoints WHERE endpoint_key = $1',
    [key]
  );
  return result.rows[0] || null;
}

export async function findEndpointsByUserId(userId) {
  const result = await query(
    `SELECT e.*,
       (SELECT COUNT(*) FROM tbl_wl_webhooks w WHERE w.endpoint_id = e.id) AS webhook_count
     FROM tbl_wl_endpoints e
     WHERE e.user_id = $1
     ORDER BY e.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function deleteEndpoint(endpointKey, userId) {
  const result = await query(
    'DELETE FROM tbl_wl_endpoints WHERE endpoint_key = $1 AND user_id = $2',
    [endpointKey, userId]
  );
  return result.rowCount;
}

export async function countEndpointsByUserId(userId) {
  const result = await query(
    'SELECT COUNT(*) AS count FROM tbl_wl_endpoints WHERE user_id = $1',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}
