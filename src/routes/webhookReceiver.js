import { Router } from 'express';
import { findEndpointByKey } from '../models/endpointModel.js';
import { createWebhook, deleteOldWebhooks } from '../models/webhookModel.js';
import { config } from '../config/index.js';

const router = Router();

async function handleWebhook(req, res) {
  const { key } = req.params;

  const endpoint = await findEndpointByKey(key);
  if (!endpoint || !endpoint.is_active) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  await createWebhook(
    endpoint.id,
    req.method,
    req.headers.host || '',
    req.headers,
    req.cookies || {},
    req.query,
    req.body || {}
  );

  await deleteOldWebhooks(endpoint.id, config.maxItemsPerEndpoint);

  const statusCode = endpoint.response_code || 200;
  if (endpoint.response_body) {
    // Try to parse as JSON, otherwise send as plain text
    try {
      const parsed = JSON.parse(endpoint.response_body);
      res.status(statusCode).json(parsed);
    } catch {
      res.status(statusCode).type('text').send(endpoint.response_body);
    }
  } else {
    res.status(statusCode).json({ status: 'received' });
  }
}

router.post('/:key', handleWebhook);
router.get('/:key', handleWebhook);
router.put('/:key', handleWebhook);
router.patch('/:key', handleWebhook);
router.delete('/:key', handleWebhook);

export { router as webhookReceiverRouter };
