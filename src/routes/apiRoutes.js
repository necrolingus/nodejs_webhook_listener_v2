import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/index.js';
import * as endpointModel from '../models/endpointModel.js';
import * as webhookModel from '../models/webhookModel.js';

const router = Router();

// All API routes require auth
router.use(requireAuth);

// Create endpoint
router.post('/endpoints', async (req, res) => {
  const { label, response_code, response_body } = req.body;
  const count = await endpointModel.countEndpointsByUserId(req.user.id);
  if (count >= config.maxEndpointsPerUser) {
    return res.status(400).json({ error: `Maximum ${config.maxEndpointsPerUser} endpoints allowed` });
  }
  // Validate response code: must be a 3-digit integer
  let code = 200;
  if (response_code !== undefined && response_code !== '') {
    code = parseInt(response_code, 10);
    if (isNaN(code) || code < 100 || code > 999) {
      return res.status(400).json({ error: 'Response code must be a 3-digit number (100-999)' });
    }
  }
  const endpointKey = crypto.randomBytes(8).toString('hex');
  const endpoint = await endpointModel.createEndpoint(req.user.id, endpointKey, label, code, response_body);
  res.status(201).json(endpoint);
});

// List endpoints
router.get('/endpoints', async (req, res) => {
  const endpoints = await endpointModel.findEndpointsByUserId(req.user.id);
  res.json(endpoints);
});

// Update endpoint response settings
router.patch('/endpoints/:key', async (req, res) => {
  const { response_code, response_body } = req.body;
  let code = 200;
  if (response_code !== undefined && response_code !== '') {
    code = parseInt(response_code, 10);
    if (isNaN(code) || code < 100 || code > 999) {
      return res.status(400).json({ error: 'Response code must be a 3-digit number (100-999)' });
    }
  }
  const endpoint = await endpointModel.updateEndpointResponse(req.params.key, req.user.id, code, response_body);
  if (!endpoint) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.json(endpoint);
});

// Delete endpoint
router.delete('/endpoints/:key', async (req, res) => {
  const deleted = await endpointModel.deleteEndpoint(req.params.key, req.user.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.json({ status: 'deleted' });
});

// Get webhooks for endpoint
router.get('/endpoints/:key/webhooks', async (req, res) => {
  const endpoint = await endpointModel.findEndpointByKey(req.params.key);
  if (!endpoint || endpoint.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const [webhooks, total] = await Promise.all([
    webhookModel.findWebhooksByEndpointId(endpoint.id, limit, offset),
    webhookModel.countWebhooksByEndpointId(endpoint.id),
  ]);
  res.json({ webhooks, total, page, limit, pages: Math.ceil(total / limit) });
});

// Delete a webhook
router.delete('/endpoints/:key/webhooks/:id', async (req, res) => {
  const endpoint = await endpointModel.findEndpointByKey(req.params.key);
  if (!endpoint || endpoint.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const deleted = await webhookModel.deleteWebhookById(parseInt(req.params.id, 10), endpoint.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Webhook not found' });
  }
  res.json({ status: 'deleted' });
});

// Keep last N webhooks for an endpoint
router.post('/endpoints/:key/webhooks/keep-last', async (req, res) => {
  const endpoint = await endpointModel.findEndpointByKey(req.params.key);
  if (!endpoint || endpoint.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const keep = parseInt(req.body.keep, 10) || 10;
  const deleted = await webhookModel.deleteOldWebhooks(endpoint.id, keep);
  res.json({ status: 'ok', deleted });
});

// Admin get all data
router.get('/admin/data', async (req, res) => {
  if (!config.adminKey || req.headers['admin-key'] !== config.adminKey) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  // Return all endpoints with their webhook counts
  const { rows } = await (await import('../db/pool.js')).query(
    `SELECT e.*, u.display_name AS owner_name,
       (SELECT COUNT(*) FROM tbl_wl_webhooks w WHERE w.endpoint_id = e.id) AS webhook_count
     FROM tbl_wl_endpoints e
     JOIN tbl_wl_users u ON e.user_id = u.id
     ORDER BY e.created_at DESC`
  );
  res.json(rows);
});

export { router as apiRouter };
