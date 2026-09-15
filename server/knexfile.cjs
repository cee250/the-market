/**
 * Knex configuration — migrations & seeds for the Market API.
 * Loads server/.env so DATABASE_URL is available to the knex CLI.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connection = process.env.DATABASE_URL;

if (!connection) {
  console.error('[knex] DATABASE_URL is not set — copy .env.example to .env and fill it in.');
  process.exit(1);
}

module.exports = {
  development: {
    client: 'pg',
    connection,
    pool: { min: 1, max: 10 },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
  },
  production: {
    client: 'pg',
    connection,
    pool: { min: 2, max: 20 },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    seeds: { directory: path.join(__dirname, 'db', 'seeds') },
  },
};
