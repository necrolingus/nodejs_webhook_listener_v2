import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, cleanDatabase } from '../setup.js';
import * as userModel from '../../src/models/userModel.js';
import * as endpointModel from '../../src/models/endpointModel.js';

describe('Endpoint Model', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  async function createTestUser() {
    const token = 'ep' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return userModel.createUser(token);
  }

  it('should create an endpoint', async () => {
    const user = await createTestUser();
    const ep = await endpointModel.createEndpoint(user.id, 'abcdef1234567890', 'Test EP');
    assert.ok(ep.id);
    assert.strictEqual(ep.endpoint_key, 'abcdef1234567890');
    assert.strictEqual(ep.label, 'Test EP');
    assert.strictEqual(ep.user_id, user.id);
  });

  it('should find endpoint by key', async () => {
    const user = await createTestUser();
    await endpointModel.createEndpoint(user.id, '1234567890abcdef', 'Find Test');
    const found = await endpointModel.findEndpointByKey('1234567890abcdef');
    assert.ok(found);
    assert.strictEqual(found.endpoint_key, '1234567890abcdef');
  });

  it('should return null for unknown key', async () => {
    const found = await endpointModel.findEndpointByKey('unknown123456789');
    assert.strictEqual(found, null);
  });

  it('should list endpoints by user id with webhook count', async () => {
    const user = await createTestUser();
    await endpointModel.createEndpoint(user.id, 'list12345678abcd', 'EP 1');
    await endpointModel.createEndpoint(user.id, 'list12345678efgh', 'EP 2');
    const endpoints = await endpointModel.findEndpointsByUserId(user.id);
    assert.strictEqual(endpoints.length, 2);
    assert.ok('webhook_count' in endpoints[0]);
  });

  it('should delete endpoint with ownership check', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await endpointModel.createEndpoint(user1.id, 'delete123456abcd');
    // user2 should not be able to delete user1's endpoint
    const deleted = await endpointModel.deleteEndpoint('delete123456abcd', user2.id);
    assert.strictEqual(deleted, 0);
    // user1 should be able to delete
    const deleted2 = await endpointModel.deleteEndpoint('delete123456abcd', user1.id);
    assert.strictEqual(deleted2, 1);
  });

  it('should count endpoints by user', async () => {
    const user = await createTestUser();
    await endpointModel.createEndpoint(user.id, 'count1234567abcd');
    await endpointModel.createEndpoint(user.id, 'count1234567efgh');
    const count = await endpointModel.countEndpointsByUserId(user.id);
    assert.strictEqual(count, 2);
  });

  it('should reject duplicate endpoint keys', async () => {
    const user = await createTestUser();
    await endpointModel.createEndpoint(user.id, 'dupe12345678abcd');
    await assert.rejects(
      () => endpointModel.createEndpoint(user.id, 'dupe12345678abcd'),
      { message: /duplicate key/i }
    );
  });
});
