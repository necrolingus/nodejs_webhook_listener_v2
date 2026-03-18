import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import crypto from 'crypto';
import { setupDatabase, cleanDatabase } from '../setup.js';
import { app } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import * as userModel from '../../src/models/userModel.js';
import * as sessionModel from '../../src/models/sessionModel.js';

describe('API Routes', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  async function createAuthenticatedAgent() {
    const user = await userModel.createUser('api' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    const sessionToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + 86400000);
    await sessionModel.createSession(user.id, sessionToken, expiresAt);
    const agent = request.agent(app);
    agent.set('Cookie', `${config.cookie.name}=${sessionToken}`);
    return { agent, user, sessionToken };
  }

  it('should require auth for API endpoints', async () => {
    const res = await request(app).get('/api/endpoints');
    assert.strictEqual(res.status, 302);
  });

  it('POST /api/endpoints should create an endpoint', async () => {
    const { agent } = await createAuthenticatedAgent();
    const res = await agent.post('/api/endpoints')
      .send({ label: 'Test Endpoint' })
      .set('Content-Type', 'application/json');
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.endpoint_key);
    assert.strictEqual(res.body.label, 'Test Endpoint');
  });

  it('GET /api/endpoints should list user endpoints', async () => {
    const { agent } = await createAuthenticatedAgent();
    await agent.post('/api/endpoints').send({ label: 'EP 1' }).set('Content-Type', 'application/json');
    await agent.post('/api/endpoints').send({ label: 'EP 2' }).set('Content-Type', 'application/json');
    const res = await agent.get('/api/endpoints');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 2);
  });

  it('DELETE /api/endpoints/:key should delete endpoint', async () => {
    const { agent } = await createAuthenticatedAgent();
    const createRes = await agent.post('/api/endpoints').send({}).set('Content-Type', 'application/json');
    const key = createRes.body.endpoint_key;
    const res = await agent.delete(`/api/endpoints/${key}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'deleted');
  });

  it('should not allow deleting another user endpoint', async () => {
    const { agent: agent1 } = await createAuthenticatedAgent();
    const { agent: agent2 } = await createAuthenticatedAgent();
    const createRes = await agent1.post('/api/endpoints').send({}).set('Content-Type', 'application/json');
    const key = createRes.body.endpoint_key;
    const res = await agent2.delete(`/api/endpoints/${key}`);
    assert.strictEqual(res.status, 404);
  });

  it('GET /api/endpoints/:key/webhooks should return paginated webhooks', async () => {
    const { agent } = await createAuthenticatedAgent();
    const createRes = await agent.post('/api/endpoints').send({}).set('Content-Type', 'application/json');
    const key = createRes.body.endpoint_key;
    // Send some webhooks
    await request(app).post(`/webhooks/${key}`).send({ n: 1 });
    await request(app).post(`/webhooks/${key}`).send({ n: 2 });
    const res = await agent.get(`/api/endpoints/${key}/webhooks`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 2);
    assert.strictEqual(res.body.webhooks.length, 2);
  });
});
