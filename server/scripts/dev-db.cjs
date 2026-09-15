/**
 * Dev-only embedded PostgreSQL.
 *
 * Gives this repository a real Postgres (18.x) with zero system setup:
 *   npm run db:start -w server
 *
 * - Data lives in server/.data/pg (gitignored, persistent across restarts)
 * - Listens on 127.0.0.1:5433 (matches DATABASE_URL in .env)
 * - For Docker-based setups use docker-compose.yml instead and point
 *   DATABASE_URL at your instance — the API does not care which one it is.
 */
const fs = require('fs');
const path = require('path');
const EP = require('embedded-postgres').default;

const port = Number(process.env.PG_PORT || 5433);
const databaseDir = path.join(__dirname, '..', '.data', 'pg');

const pg = new EP({
  databaseDir,
  user: 'market',
  password: 'market',
  port,
  persistent: true,
});

(async () => {
  // initialise() runs initdb only for a fresh directory; a persisted cluster
  // (PG_VERSION present) is reused as-is.
  if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION'))) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase('market');
  } catch {
    // "already exists" on restarts — expected.
  }
  console.log(`[db] Postgres running on 127.0.0.1:${port} (user: market, db: market)`);
  console.log('[db] Stopping this process stops Postgres; data persists in server/.data/pg');
})().catch((err) => {
  console.error('[db] Failed to start Postgres:', err.message);
  process.exit(1);
});
