import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, cleanDatabase } from '../setup.js';
import * as userModel from '../../src/models/userModel.js';
import * as sessionModel from '../../src/models/sessionModel.js';
import { requireAuth, optionalAuth } from '../../src/middleware/auth.js';
import { config } from '../../src/config/index.js';

describe('Auth Middleware', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  function mockReq(cookieValue) {
    return { cookies: { [config.cookie.name]: cookieValue } };
  }

  function mockRes() {
    const res = {
      redirected: null,
      clearedCookie: false,
      redirect(url) { res.redirected = url; },
      clearCookie() { res.clearedCookie = true; },
    };
    return res;
  }

  it('requireAuth should redirect when no cookie', async () => {
    const req = { cookies: {} };
    const res = mockRes();
    let nextCalled = false;
    await requireAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.redirected, '/login');
    assert.strictEqual(nextCalled, false);
  });

  it('requireAuth should redirect when invalid cookie', async () => {
    const req = mockReq('invalid-token');
    const res = mockRes();
    let nextCalled = false;
    await requireAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.redirected, '/login');
    assert.strictEqual(res.clearedCookie, true);
    assert.strictEqual(nextCalled, false);
  });

  it('requireAuth should set req.user for valid session', async () => {
    const user = await userModel.createUser('authtest12345');
    const expiresAt = new Date(Date.now() + 86400000);
    await sessionModel.createSession(user.id, 'valid-auth-token', expiresAt);
    const req = mockReq('valid-auth-token');
    const res = mockRes();
    let nextCalled = false;
    await requireAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.ok(req.user);
    assert.strictEqual(req.user.id, user.id);
  });

  it('optionalAuth should set req.user to undefined when no cookie', async () => {
    const req = { cookies: {} };
    const res = mockRes();
    let nextCalled = false;
    await optionalAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user, undefined);
  });

  it('optionalAuth should set req.user for valid session', async () => {
    const user = await userModel.createUser('optauth12345');
    const expiresAt = new Date(Date.now() + 86400000);
    await sessionModel.createSession(user.id, 'opt-auth-token', expiresAt);
    const req = mockReq('opt-auth-token');
    const res = mockRes();
    let nextCalled = false;
    await optionalAuth(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    assert.ok(req.user);
    assert.strictEqual(req.user.id, user.id);
  });
});
