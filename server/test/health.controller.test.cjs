const assert = require('node:assert/strict');
const test = require('node:test');
const { HealthController } = require('../dist/health/health.controller.js');

function createController({ databaseUp = true, version = 'test-version' } = {}) {
  return new HealthController(
    {
      connection: {
        raw: async () => {
          if (!databaseUp) throw new Error('database unavailable');
          return { rows: [{ '?column?': 1 }] };
        },
      },
    },
    { get: (key) => (key === 'APP_VERSION' ? version : undefined) },
  );
}

test('liveness returns a process-level success payload without database access', () => {
  const payload = createController({ databaseUp: false }).live();
  assert.equal(payload.status, 'ok');
  assert.equal(payload.api, 'up');
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('readiness returns dependency diagnostics when the database is available', async () => {
  const payload = await createController({ version: '1.2.3' }).ready();
  assert.equal(payload.status, 'ok');
  assert.equal(payload.database, 'up');
  assert.equal(payload.api, 'up');
  assert.equal(payload.version, '1.2.3');
  assert.equal(payload.checks.database.status, 'up');
  assert.equal(typeof payload.checks.database.latencyMs, 'number');
  assert.ok(payload.checks.database.latencyMs >= 0);
  assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test('readiness fails with a service-unavailable response and down diagnostics', async () => {
  await assert.rejects(
    () => createController({ databaseUp: false }).ready(),
    (error) => {
      assert.equal(error.getStatus(), 503);
      const response = error.getResponse();
      assert.equal(response.status, 'degraded');
      assert.equal(response.database, 'down');
      assert.equal(response.checks.database.status, 'down');
      assert.equal(response.checks.database.latencyMs, null);
      return true;
    },
  );
});

test('the general health check shares the readiness contract', async () => {
  const payload = await createController().check();
  assert.equal(payload.status, 'ok');
  assert.deepEqual(payload.checks.database.status, payload.database);
});
