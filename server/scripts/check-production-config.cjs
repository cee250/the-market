const assert = require('node:assert/strict');
const { validateEnv } = require('../dist/config/env.validation.js');

assert.throws(() => validateEnv({ DATABASE_URL: 'postgres://db', NODE_ENV: 'production', JWT_SECRET: 'short', CORS_ORIGIN: 'https://market.rw' }), /JWT_SECRET/);
assert.throws(() => validateEnv({ DATABASE_URL: 'postgres://db', NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32) }), /CORS_ORIGIN/);
assert.doesNotThrow(() => validateEnv({ DATABASE_URL: 'postgres://db', NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32), CORS_ORIGIN: 'https://market.rw' }));
console.log('production config checks passed');
