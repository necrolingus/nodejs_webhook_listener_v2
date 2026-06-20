import { query } from '../db/pool.js';

export async function createWebhook(endpointId, method, host, headers, cookies, queryParams, body) {
  const result = await query(
    `INSERT INTO tbl_wl_webhooks (endpoint_id, http_method, source_host, headers, cookies, query_params, body)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [endpointId, method, host, JSON.stringify(headers), JSON.stringify(cookies), JSON.stringify(queryParams), JSON.stringify(body)]
  );
  return result.rows[0];
}

export async function findWebhooksByEndpointId(endpointId, limit = 50, offset = 0) {
  const result = await query(
    `SELECT * FROM tbl_wl_webhooks
     WHERE endpoint_id = $1
     ORDER BY received_at DESC
     LIMIT $2 OFFSET $3`,
    [endpointId, limit, offset]
  );
  return result.rows;
}

export async function countWebhooksByEndpointId(endpointId) {
  const result = await query(
    'SELECT COUNT(*) AS count FROM tbl_wl_webhooks WHERE endpoint_id = $1',
    [endpointId]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function deleteOldWebhooks(endpointId, maxItems) {
  const result = await query(
    `DELETE FROM tbl_wl_webhooks
     WHERE id IN (
       SELECT id FROM tbl_wl_webhooks
       WHERE endpoint_id = $1
       ORDER BY received_at DESC
       LIMIT -1 OFFSET $2
     )`,
    [endpointId, maxItems]
  );
  return result.rowCount;
}

export async function deleteWebhookById(id, endpointId) {
  const result = await query(
    'DELETE FROM tbl_wl_webhooks WHERE id = $1 AND endpoint_id = $2',
    [id, endpointId]
  );
  return result.rowCount;
}
