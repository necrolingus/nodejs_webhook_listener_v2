import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { setupDatabase, cleanDatabase } from '../setup.js';
import { app } from '../../src/app.js';
import { config } from '../../src/config/index.js';

describe('Login Flow (end-to-end)', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  it('should complete full login, create endpoint, receive webhook, recover flow', async () => {
    // Step 1: Create account
    const createRes = await request(app)
      .post('/login')
      .send('action=create')
      .set('Content-Type', 'application/x-www-form-urlencoded');
    assert.strictEqual(createRes.status, 200);

    // Extract recovery token from response HTML
    const tokenMatch = createRes.text.match(/id="recoveryToken">([a-f0-9]+)</);
    assert.ok(tokenMatch, 'Recovery token should be displayed');
    const recoveryToken = tokenMatch[1];

    // Extract session cookie
    const cookies = createRes.headers['set-cookie'];
    assert.ok(cookies);
    const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies;

    // Step 2: Access dashboard with cookie
    const dashRes = await request(app)
      .get('/dashboard')
      .set('Cookie', cookieStr);
    assert.strictEqual(dashRes.status, 200);
    assert.ok(dashRes.text.includes('Dashboard'));

    // Step 3: Create an endpoint
    const epRes = await request(app)
      .post('/api/endpoints')
      .set('Cookie', cookieStr)
      .send({ label: 'Flow Test' })
      .set('Content-Type', 'application/json');
    assert.strictEqual(epRes.status, 201);
    const endpointKey = epRes.body.endpoint_key;

    // Step 4: Send webhook
    const whRes = await request(app)
      .post(`/webhooks/${endpointKey}`)
      .send({ event: 'test', data: { value: 42 } })
      .set('Content-Type', 'application/json');
    assert.strictEqual(whRes.status, 200);

    // Step 5: Verify webhook appears
    const webhooksRes = await request(app)
      .get(`/api/endpoints/${endpointKey}/webhooks`)
      .set('Cookie', cookieStr);
    assert.strictEqual(webhooksRes.status, 200);
    assert.strictEqual(webhooksRes.body.total, 1);
    assert.deepStrictEqual(webhooksRes.body.webhooks[0].body, { event: 'test', data: { value: 42 } });

    // Step 6: Logout
    const logoutRes = await request(app)
      .post('/logout')
      .set('Cookie', cookieStr);
    assert.strictEqual(logoutRes.status, 302);

    // Step 7: Old cookie should not work
    const afterLogout = await request(app)
      .get('/dashboard')
      .set('Cookie', cookieStr);
    assert.strictEqual(afterLogout.status, 302);

    // Step 8: Recover account with recovery token
    const recoverRes = await request(app)
      .post('/login')
      .send(`action=recover&recovery_token=${recoveryToken}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');
    assert.strictEqual(recoverRes.status, 302);
    const newCookies = recoverRes.headers['set-cookie'];
    const newCookieStr = Array.isArray(newCookies) ? newCookies.join('; ') : newCookies;

    // Step 9: Data should still be there
    const recoveredEndpoints = await request(app)
      .get('/api/endpoints')
      .set('Cookie', newCookieStr);
    assert.strictEqual(recoveredEndpoints.status, 200);
    assert.strictEqual(recoveredEndpoints.body.length, 1);
    assert.strictEqual(recoveredEndpoints.body[0].label, 'Flow Test');

    // Step 10: Webhooks still there
    const recoveredWebhooks = await request(app)
      .get(`/api/endpoints/${endpointKey}/webhooks`)
      .set('Cookie', newCookieStr);
    assert.strictEqual(recoveredWebhooks.status, 200);
    assert.strictEqual(recoveredWebhooks.body.total, 1);
  });
});
