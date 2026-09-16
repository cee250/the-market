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

  const firstProduct = products.body.items[0];
  if (firstProduct) {
    const productKey = firstProduct.slug ?? firstProduct.id;
    const detail = await request(`/marketplace/products/${encodeURIComponent(productKey)}`);
    assert(detail.response.status === 200, `product detail returned ${detail.response.status}`);
    const reviews = await request(`/marketplace/products/${encodeURIComponent(productKey)}/reviews`);
    assert(reviews.response.status === 200 && Array.isArray(reviews.body), 'product reviews did not return an array');
  }

  const categories = await request('/categories');
  assert(categories.response.status === 200, `categories returned ${categories.response.status}`);
  assert(Array.isArray(categories.body), 'categories did not return an array');

  const protectedResponse = await request('/auth/me');
  assert([401, 403].includes(protectedResponse.response.status), `unauthenticated /auth/me returned ${protectedResponse.response.status}`);

  const email = `e2e-${Date.now()}@market.test`;
  const registration = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'E2E Customer', email, password: 'E2ePassword123!' }),
  });
  assert(registration.response.status === 201, `registration returned ${registration.response.status}`);
  const setCookie = registration.response.headers.get('set-cookie');
  assert(setCookie?.startsWith('market_session='), 'registration did not issue a session cookie');
  const authenticated = await request('/auth/me', { headers: { Cookie: setCookie.split(';')[0] } });
  assert(authenticated.response.status === 200 && authenticated.body?.user?.email === email, 'authenticated /auth/me response is invalid');

  const sessionHeaders = { Cookie: setCookie.split(';')[0] };
  const cart = await request('/cart', { headers: sessionHeaders });
  assert(cart.response.status === 200 && Array.isArray(cart.body?.items), 'authenticated cart response is invalid');
  const invalidCheckout = await request('/checkout', {
    method: 'POST',
    headers: { ...sessionHeaders, 'Content-Type': 'application/json', 'Idempotency-Key': `e2e-invalid-${Date.now()}` },
    body: JSON.stringify({}),
  });
  assert(invalidCheckout.response.status === 400, `invalid checkout returned ${invalidCheckout.response.status}`);
  const orders = await request('/orders', { headers: sessionHeaders });
  assert(orders.response.status === 200 && Array.isArray(orders.body), 'authenticated orders response is invalid');

  const vendorEmail = `e2e-vendor-${Date.now()}@market.test`;
  const vendorRegistration = await request('/auth/register/vendor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E Vendor',
      businessName: 'E2E Market Shop',
      email: vendorEmail,
      phone: '0780000000',
      location: 'Kigali',
      password: 'E2eVendor123!',
      confirmPassword: 'E2eVendor123!',
      termsVersion: '2026-01',
    }),
  });
  assert(vendorRegistration.response.status === 201, `vendor registration returned ${vendorRegistration.response.status}`);
  const vendorCookie = vendorRegistration.response.headers.get('set-cookie');
  assert(vendorCookie?.startsWith('market_session='), 'vendor registration did not issue a session cookie');
  const vendorHeaders = { Cookie: vendorCookie.split(';')[0] };
  assert(vendorRegistration.body?.user?.vendorStatus === 'PENDING_PAYMENT', 'new vendor did not start in PENDING_PAYMENT');

  const vendorPackages = await request('/payments/packages', { headers: vendorHeaders });
  assert(vendorPackages.response.status === 200 && vendorPackages.body?.[0]?.id, 'vendor package list is invalid');
  const vendorPayment = await request('/payments/vendor', {
    method: 'POST',
    headers: { ...vendorHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId: vendorPackages.body[0].id, paymentMethod: 'mobile-money', reference: 'E2E-REFERENCE' }),
  });
  assert(vendorPayment.response.status === 201 && vendorPayment.body?.status === 'PENDING_REVIEW', 'vendor payment was not recorded for review');

  const adminLogin = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ADMIN_EMAIL || 'admin@market.rw', password: process.env.ADMIN_PASSWORD || 'ChangeMe123!' }),
  });
  assert(adminLogin.response.status === 200, `admin login returned ${adminLogin.response.status}`);
  const adminCookie = adminLogin.response.headers.get('set-cookie');
  assert(adminCookie?.startsWith('market_session='), 'admin login did not issue a session cookie');
  const adminHeaders = { Cookie: adminCookie.split(';')[0] };
  const adminPayments = await request('/payments/admin', { headers: adminHeaders });
  assert(adminPayments.response.status === 200 && Array.isArray(adminPayments.body), 'admin payment queue is invalid');
  const pendingPayment = adminPayments.body.find((payment) => payment.id === vendorPayment.body.id);
  assert(pendingPayment?.status === 'PENDING_REVIEW', 'submitted vendor payment was not visible in admin queue');
  const reviewedPayment = await request(`/payments/admin/${pendingPayment.id}/review`, {
    method: 'POST',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'VERIFIED', reviewNote: 'E2E verification' }),
  });
  assert(reviewedPayment.response.status === 200 && reviewedPayment.body?.status === 'VERIFIED' && reviewedPayment.body?.vendorStatus === 'PENDING_APPROVAL', 'payment review did not move vendor to PENDING_APPROVAL');

  const managedVendors = await request('/vendors/admin', { headers: adminHeaders });
  assert(managedVendors.response.status === 200 && Array.isArray(managedVendors.body), 'admin vendor list is invalid');
  const managedVendor = managedVendors.body.find((vendor) => vendor.email === vendorEmail);
  assert(managedVendor?.status === 'PENDING_APPROVAL', 'verified vendor was not visible as PENDING_APPROVAL');
  const activatedVendor = await request(`/vendors/admin/${managedVendor.id}/action`, {
    method: 'POST',
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'ACTIVATE', note: 'E2E activation' }),
  });
  assert(activatedVendor.response.status === 201 && activatedVendor.body?.status === 'ACTIVE', `admin activation did not activate vendor: HTTP ${activatedVendor.response.status} ${JSON.stringify(activatedVendor.body)}`);

  const vendorDashboard = await request('/shops/dashboard', { headers: vendorHeaders });
  assert(vendorDashboard.response.status === 200 && vendorDashboard.body?.vendorStatus === 'ACTIVE', 'activated vendor dashboard is invalid');
  const vendorOrders = await request('/vendor-orders', { headers: vendorHeaders });
  assert(vendorOrders.response.status === 200 && Array.isArray(vendorOrders.body), 'vendor order list is invalid');
  console.log('[e2e] PASS health, catalog, categories, auth/session, cart, checkout, orders, vendor onboarding, payment review, activation, and fulfillment boundaries');
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
