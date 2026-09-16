const { spawn, execFileSync } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const serverDir = path.join(root, 'server');
const port = Number(process.env.E2E_PORT || 4400);
const databaseUrl = process.env.E2E_DATABASE_URL || 'postgresql://market:market@127.0.0.1:5433/market?schema=public';
const baseUrl = `http://127.0.0.1:${port}/api`;
const children = [];

function start(command, args, env = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  child.stdout.on('data', (chunk) => process.stdout.write(`[${command}] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[${command}] ${chunk}`));
  children.push(child);
  return child;
}

function stopAll() {
  for (const child of children.reverse()) {
    if (child.killed) continue;
    if (process.platform !== 'win32') {
      try {
        process.kill(-child.pid, 'SIGTERM');
        continue;
      } catch {
        // Fall back to terminating the direct child if its process group is gone.
      }
    }
    child.kill('SIGTERM');
  }
}

function waitForChildOrDelay(child, delayMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, delayMs);
    child.once('exit', (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`database bootstrap exited before startup (code=${code}, signal=${signal ?? 'none'})`));
    });
  });
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep non-JSON response text for useful failure output.
  }
  return { response, body };
}

async function waitFor(pathname, expectedStatus, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'not attempted';
  while (Date.now() < deadline) {
    try {
      const result = await request(pathname);
      if (result.response.status === expectedStatus) return result;
      lastError = `HTTP ${result.response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${pathname} (${lastError})`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  process.env.DATABASE_URL = databaseUrl;
  console.log(`[e2e] starting API smoke test on port ${port}`);
  if (process.env.E2E_SKIP_DB !== '1') {
    const database = start(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'db:start', '-w', 'server']);
    await waitForChildOrDelay(database, 1500);
  } else {
    console.log('[e2e] using externally managed PostgreSQL');
  }

  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'db:migrate', '-w', 'server'], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'db:seed', '-w', 'server'], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  start(process.execPath, [path.join(serverDir, 'dist', 'main.js')], {
    PORT: String(port),
    NODE_ENV: 'development',
    CORS_ORIGIN: `http://localhost:${port}`,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: 'e2e-only-secret-not-for-production',
  });

  const live = await waitFor('/health/live', 200);
  assert(live.body?.status === 'ok' && live.body?.api === 'up', 'liveness payload is invalid');
  const ready = await waitFor('/health/ready', 200);
  assert(ready.body?.status === 'ok' && ready.body?.database === 'up', 'readiness payload is invalid');

  const products = await request('/marketplace/products');
  assert(products.response.status === 200, `marketplace products returned ${products.response.status}`);
  assert(Array.isArray(products.body?.items), 'marketplace products did not return an items array');

  const categories = await request('/categories');
  assert(categories.response.status === 200, `categories returned ${categories.response.status}`);
  assert(Array.isArray(categories.body), 'categories did not return an array');

  const protectedResponse = await request('/auth/me');
  assert([401, 403].includes(protectedResponse.response.status), `unauthenticated /auth/me returned ${protectedResponse.response.status}`);

  console.log('[e2e] PASS health/live, health/ready, marketplace/products, categories, auth/me authorization');
}

main()
  .then(() => {
    stopAll();
  })
  .catch((error) => {
    console.error(`[e2e] FAIL ${error instanceof Error ? error.message : String(error)}`);
    stopAll();
    process.exitCode = 1;
  });
