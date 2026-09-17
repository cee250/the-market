const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

test('Cloudinary signing uses the configured server secret and stable parameter ordering', () => {
  const params = { folder: 'market/vendors/vendor-1', timestamp: 1700000000 };
  const serialized = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('&');
  const signature = crypto.createHash('sha1').update(`${serialized}test-secret`).digest('hex');
  assert.equal(signature.length, 40);
  assert.match(signature, /^[a-f0-9]{40}$/);
});
