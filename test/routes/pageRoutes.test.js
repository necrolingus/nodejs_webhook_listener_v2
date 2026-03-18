import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import crypto from 'crypto';
import { setupDatabase, cleanDatabase } from '../setup.js';
import { app } from '../../src/app.js';
import { config } from '../../src/config/index.js';
import * as userModel from '../../src/models/userModel.js';
import * as sessionModel from '../../src/models/sessionModel.js';

describe('Page Routes', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  it('GET / should show login page for unauthenticated user', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Webhook Listener'));
  });

  it('GET / should redirect authenticated user to dashboard', async () => {
    const user = await userModel.createUser('page' + Date.now().toString(36));
    const sessionToken = crypto.randomBytes(48).toString('hex');
    await sessionModel.createSession(user.id, sessionToken, new Date(Date.now() + 86400000));
    const res = await request(app)
      .get('/')
      .set('Cookie', `${config.cookie.name}=${sessionToken}`);
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/dashboard'));
  });

  it('POST /login with action=create should create user and set cookie', async () => {
    const res = await request(app)
      .post('/login')
      .send('action=create')
      .set('Content-Type', 'application/x-www-form-urlencoded');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['set-cookie']);
    assert.ok(res.text.includes('Account Created'));
  });

  it('POST /login with action=recover and valid token should redirect to dashboard', async () => {
    const user = await userModel.createUser('recovertest123');
    const res = await request(app)
      .post('/login')
      .send('action=recover&recovery_token=recovertest123')
      .set('Content-Type', 'application/x-www-form-urlencoded');
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/dashboard'));
  });

  it('POST /login with action=recover and invalid token should show error', async () => {
    const res = await request(app)
      .post('/login')
      .send('action=recover&recovery_token=badtoken')
      .set('Content-Type', 'application/x-www-form-urlencoded');
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes('Invalid recovery token'));
  });

  it('GET /dashboard should require auth', async () => {
    const res = await request(app).get('/dashboard');
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/login'));
  });

  it('GET /settings should require auth', async () => {
    const res = await request(app).get('/settings');
    assert.strictEqual(res.status, 302);
    assert.ok(res.headers.location.includes('/login'));
  });
});
