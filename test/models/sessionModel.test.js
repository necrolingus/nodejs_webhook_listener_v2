import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, cleanDatabase } from '../setup.js';
import * as userModel from '../../src/models/userModel.js';
import * as sessionModel from '../../src/models/sessionModel.js';

describe('Session Model', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  async function createTestUser() {
    const token = 'sess' + Date.now().toString(36);
    return userModel.createUser(token);
  }

  it('should create a session', async () => {
    const user = await createTestUser();
    const expiresAt = new Date(Date.now() + 86400000);
    const session = await sessionModel.createSession(user.id, 'session-token-123', expiresAt);
    assert.ok(session.id);
    assert.strictEqual(session.user_id, user.id);
    assert.strictEqual(session.session_token, 'session-token-123');
  });

  it('should find valid session by token', async () => {
    const user = await createTestUser();
    const expiresAt = new Date(Date.now() + 86400000);
    await sessionModel.createSession(user.id, 'valid-session-456', expiresAt);
    const found = await sessionModel.findSessionByToken('valid-session-456');
    assert.ok(found);
    assert.strictEqual(found.user.id, user.id);
    assert.strictEqual(found.session.session_token, 'valid-session-456');
  });

  it('should not find expired session', async () => {
    const user = await createTestUser();
    const expiresAt = new Date(Date.now() - 1000); // expired
    await sessionModel.createSession(user.id, 'expired-session', expiresAt);
    const found = await sessionModel.findSessionByToken('expired-session');
    assert.strictEqual(found, null);
  });

  it('should return null for unknown token', async () => {
    const found = await sessionModel.findSessionByToken('unknown-token');
    assert.strictEqual(found, null);
  });

  it('should delete a session', async () => {
    const user = await createTestUser();
    const expiresAt = new Date(Date.now() + 86400000);
    await sessionModel.createSession(user.id, 'delete-session', expiresAt);
    const deleted = await sessionModel.deleteSession('delete-session');
    assert.strictEqual(deleted, 1);
    const found = await sessionModel.findSessionByToken('delete-session');
    assert.strictEqual(found, null);
  });

  it('should delete expired sessions', async () => {
    const user = await createTestUser();
    await sessionModel.createSession(user.id, 'expired-1', new Date(Date.now() - 1000));
    await sessionModel.createSession(user.id, 'expired-2', new Date(Date.now() - 2000));
    await sessionModel.createSession(user.id, 'still-valid', new Date(Date.now() + 86400000));
    const deleted = await sessionModel.deleteExpiredSessions();
    assert.strictEqual(deleted, 2);
  });
});
