import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { setupDatabase, cleanDatabase } from '../setup.js';
import { app } from '../../src/app.js';
import * as userModel from '../../src/models/userModel.js';
import * as endpointModel from '../../src/models/endpointModel.js';
import * as webhookModel from '../../src/models/webhookModel.js';

describe('Webhook Receiver Routes', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  async function createTestEndpoint() {
    const user = await userModel.createUser('whrecv' + Date.now().toString(36));
    return endpointModel.createEndpoint(user.id, 'recv' + Date.now().toString(36).slice(0, 12).padEnd(12, '0'));
  }

  it('POST /webhooks/:key should store webhook data', async () => {
    const ep = await createTestEndpoint();
    const res = await request(app)
      .post(`/webhooks/${ep.endpoint_key}`)
      .send({ test: true })
      .set('Content-Type', 'application/json');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'received');
    const count = await webhookModel.countWebhooksByEndpointId(ep.id);
    assert.strictEqual(count, 1);
  });

  it('GET /webhooks/:key should store webhook data', async () => {
    const ep = await createTestEndpoint();
    const res = await request(app)
      .get(`/webhooks/${ep.endpoint_key}`)
      .query({ param1: 'value1' });
    assert.strictEqual(res.status, 200);
    const webhooks = await webhookModel.findWebhooksByEndpointId(ep.id);
    assert.strictEqual(webhooks[0].http_method, 'GET');
    assert.strictEqual(webhooks[0].query_params.param1, 'value1');
  });

  it('PUT /webhooks/:key should store webhook data', async () => {
    const ep = await createTestEndpoint();
    const res = await request(app)
      .put(`/webhooks/${ep.endpoint_key}`)
      .send({ updated: true });
    assert.strictEqual(res.status, 200);
  });

  it('PATCH /webhooks/:key should store webhook data', async () => {
    const ep = await createTestEndpoint();
    const res = await request(app)
      .patch(`/webhooks/${ep.endpoint_key}`)
      .send({ patched: true });
    assert.strictEqual(res.status, 200);
  });

  it('DELETE /webhooks/:key should store webhook data', async () => {
    const ep = await createTestEndpoint();
    const res = await request(app)
      .delete(`/webhooks/${ep.endpoint_key}`);
    assert.strictEqual(res.status, 200);
  });

  it('should return 404 for unknown endpoint', async () => {
    const res = await request(app)
      .post('/webhooks/nonexistent1234567');
    assert.strictEqual(res.status, 404);
  });

  it('should capture headers correctly', async () => {
    const ep = await createTestEndpoint();
    await request(app)
      .post(`/webhooks/${ep.endpoint_key}`)
      .set('X-Custom-Header', 'test-value')
      .send({});
    const webhooks = await webhookModel.findWebhooksByEndpointId(ep.id);
    assert.strictEqual(webhooks[0].headers['x-custom-header'], 'test-value');
  });
});
