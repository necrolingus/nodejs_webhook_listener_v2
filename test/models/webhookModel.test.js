import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, cleanDatabase } from '../setup.js';
import * as userModel from '../../src/models/userModel.js';
import * as endpointModel from '../../src/models/endpointModel.js';
import * as webhookModel from '../../src/models/webhookModel.js';

describe('Webhook Model', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  async function createTestEndpoint() {
    const token = 'wh' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const user = await userModel.createUser(token);
    const key = token.slice(0, 16).padEnd(16, '0');
    const ep = await endpointModel.createEndpoint(user.id, key);
    return ep;
  }

  it('should create a webhook', async () => {
    const ep = await createTestEndpoint();
    const wh = await webhookModel.createWebhook(
      ep.id, 'POST', 'example.com',
      { 'content-type': 'application/json' },
      {}, { page: '1' }, { key: 'value' }
    );
    assert.ok(wh.id);
    assert.strictEqual(wh.http_method, 'POST');
    assert.strictEqual(wh.source_host, 'example.com');
  });

  it('should find webhooks by endpoint id with pagination', async () => {
    const ep = await createTestEndpoint();
    for (let i = 0; i < 5; i++) {
      await webhookModel.createWebhook(ep.id, 'POST', 'host.com', {}, {}, {}, { i });
    }
    const page1 = await webhookModel.findWebhooksByEndpointId(ep.id, 3, 0);
    assert.strictEqual(page1.length, 3);
    const page2 = await webhookModel.findWebhooksByEndpointId(ep.id, 3, 3);
    assert.strictEqual(page2.length, 2);
  });

  it('should count webhooks by endpoint id', async () => {
    const ep = await createTestEndpoint();
    await webhookModel.createWebhook(ep.id, 'POST', 'host.com', {}, {}, {}, {});
    await webhookModel.createWebhook(ep.id, 'GET', 'host.com', {}, {}, {}, {});
    const count = await webhookModel.countWebhooksByEndpointId(ep.id);
    assert.strictEqual(count, 2);
  });

  it('should delete old webhooks beyond max', async () => {
    const ep = await createTestEndpoint();
    for (let i = 0; i < 5; i++) {
      await webhookModel.createWebhook(ep.id, 'POST', 'host.com', {}, {}, {}, { i });
    }
    await webhookModel.deleteOldWebhooks(ep.id, 3);
    const count = await webhookModel.countWebhooksByEndpointId(ep.id);
    assert.strictEqual(count, 3);
  });

  it('should delete a webhook by id', async () => {
    const ep = await createTestEndpoint();
    const wh = await webhookModel.createWebhook(ep.id, 'POST', 'host.com', {}, {}, {}, {});
    const deleted = await webhookModel.deleteWebhookById(wh.id, ep.id);
    assert.strictEqual(deleted, 1);
    const count = await webhookModel.countWebhooksByEndpointId(ep.id);
    assert.strictEqual(count, 0);
  });

  it('should store and retrieve JSONB data correctly', async () => {
    const ep = await createTestEndpoint();
    const body = { nested: { array: [1, 2, 3], obj: { key: 'val' } } };
    const headers = { 'x-custom': 'header-value' };
    await webhookModel.createWebhook(ep.id, 'POST', 'host.com', headers, {}, {}, body);
    const webhooks = await webhookModel.findWebhooksByEndpointId(ep.id);
    assert.deepStrictEqual(webhooks[0].body, body);
    assert.deepStrictEqual(webhooks[0].headers, headers);
  });
});
