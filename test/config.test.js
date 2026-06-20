import { describe, it } from 'node:test';
import assert from 'node:assert';
import { config } from '../src/config/index.js';

describe('Config', () => {
  it('should load port from env or default', () => {
    assert.strictEqual(typeof config.port, 'number');
    assert.ok(config.port > 0);
  });

  it('should load cookie settings', () => {
    assert.strictEqual(typeof config.cookie.name, 'string');
    assert.ok(config.cookie.name.length > 0);
    assert.strictEqual(typeof config.cookie.maxAgeDays, 'number');
    assert.ok(config.cookie.maxAgeDays > 0);
    assert.strictEqual(typeof config.cookie.secret, 'string');
  });

  it('should load database settings', () => {
    assert.strictEqual(typeof config.db.file, 'string');
  });

  it('should load max items per endpoint', () => {
    assert.strictEqual(typeof config.maxItemsPerEndpoint, 'number');
    assert.ok(config.maxItemsPerEndpoint > 0);
  });

  it('should load max endpoints per user', () => {
    assert.strictEqual(typeof config.maxEndpointsPerUser, 'number');
    assert.ok(config.maxEndpointsPerUser > 0);
  });

  it('should be frozen (immutable)', () => {
    assert.throws(() => {
      config.port = 9999;
    });
  });
});
