const assert = require('node:assert/strict');
const test = require('node:test');
const { validateEnv } = require('../dist/config/env.validation.js');

test('development config applies safe local defaults', () => {
  const config = validateEnv({ DATABASE_URL: 'postgres://localhost/market', NODE_ENV: 'development' });
  assert.equal(config.PORT, 4000);
  assert.equal(config.NODE_ENV, 'development');
  assert.match(config.JWT_SECRET, /dev-only-secret/);
});

test('production rejects a weak JWT secret', () => {
  assert.throws(
    () => validateEnv({ DATABASE_URL: 'postgres://db/market', NODE_ENV: 'production', JWT_SECRET: 'short', CORS_ORIGIN: 'https://market.rw' }),
    /JWT_SECRET must be a strong/,
  );
});

test('production requires an explicit CORS origin', () => {
  assert.throws(
    () => validateEnv({ DATABASE_URL: 'postgres://db/market', NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32) }),
    /CORS_ORIGIN must be explicitly configured/,
  );
});

test('production accepts strong credentials and explicit CORS', () => {
  const config = validateEnv({ DATABASE_URL: 'postgres://db/market', NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32), CORS_ORIGIN: 'https://market.rw' });
  assert.equal(config.CORS_ORIGIN, 'https://market.rw');
});

test('rate-limit settings reject unsafe values', () => {
  assert.throws(
    () => validateEnv({ DATABASE_URL: 'postgres://db/market', RATE_LIMIT_WINDOW_MS: 500 }),
    /RATE_LIMIT_WINDOW_MS/,
  );
  assert.throws(
    () => validateEnv({ DATABASE_URL: 'postgres://db/market', RATE_LIMIT_MAX: 0 }),
    /RATE_LIMIT_MAX/,
  );
});

test('rate-limit settings receive safe defaults', () => {
  const config = validateEnv({ DATABASE_URL: 'postgres://db/market' });
  assert.equal(config.RATE_LIMIT_WINDOW_MS, 60000);
  assert.equal(config.RATE_LIMIT_MAX, 10);
});
