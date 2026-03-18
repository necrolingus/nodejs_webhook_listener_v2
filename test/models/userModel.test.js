import { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert';
import { setupDatabase, cleanDatabase } from '../setup.js';
import * as userModel from '../../src/models/userModel.js';

describe('User Model', () => {
  before(async () => await setupDatabase());
  afterEach(async () => await cleanDatabase());


  it('should create a user with recovery token', async () => {
    const user = await userModel.createUser('abc123def456');
    assert.ok(user.id);
    assert.strictEqual(user.recovery_token, 'abc123def456');
    assert.ok(user.created_at);
  });

  it('should find user by id', async () => {
    const created = await userModel.createUser('findbyid12345');
    const found = await userModel.findUserById(created.id);
    assert.strictEqual(found.id, created.id);
    assert.strictEqual(found.recovery_token, 'findbyid12345');
  });

  it('should find user by recovery token', async () => {
    await userModel.createUser('tokentest1234');
    const found = await userModel.findUserByRecoveryToken('tokentest1234');
    assert.ok(found);
    assert.strictEqual(found.recovery_token, 'tokentest1234');
  });

  it('should return null for unknown recovery token', async () => {
    const found = await userModel.findUserByRecoveryToken('nonexistent999');
    assert.strictEqual(found, null);
  });

  it('should update display name', async () => {
    const user = await userModel.createUser('updatename123');
    const updated = await userModel.updateDisplayName(user.id, 'Test User');
    assert.strictEqual(updated.display_name, 'Test User');
  });

  it('should reject duplicate recovery tokens', async () => {
    await userModel.createUser('duplicate12345');
    await assert.rejects(
      () => userModel.createUser('duplicate12345'),
      { message: /duplicate key/i }
    );
  });
});
