# Market — Multi-Vendor E-Commerce Marketplace

A professional multi-vendor marketplace: vendors get their own shop, products with
variants & images, simple inventory, subscriptions and orders; customers get a real
marketplace with multi-vendor cart, checkout and order tracking.

> **Guidance:** `Market_Marketplace_Architecture_v1.2` — built strictly **one phase at a time**,
> stopping after each phase for confirmation.

## Current status

| Phase | Scope | Status |
| ----- | ----- | ------ |
| Frontend (pre-spec) | Full storefront SPA | ✅ Done |
| **Phase 1** | **Project setup, environment, base UI, DB connection, foundational architecture** | ✅ **Done** |
| Phase 2 | Authentication (roles, secure passwords, sessions, password reset) | ⏳ Next |
| Phase 3–18 | Vendor registration → payments → hardening | ⏳ Planned |

## Architecture

```
the-market/                     npm workspaces monorepo
├── client/                     Storefront SPA (Vite 7 + React 19 + TS + Tailwind v4)
│   └── src/
│       ├── pages/              13 routes (home, catalog, product, cart, checkout, orders, …)
│       ├── components/         layout / product / ui
│       ├── context/            cart, wishlist, compare, auth (mock), toasts
│       └── services/api.ts     ⭐ data layer — mock today, real API from Phase 11
├── server/                     API (NestJS 11 + Knex + PostgreSQL 18)
│   ├── src/
│   │   ├── main.ts             bootstrap: /api prefix, CORS, validation pipe, shutdown hooks
│   │   ├── app.module.ts       Config (validated env) + Database (global) + feature modules
│   │   ├── config/             env.validation.ts — fail fast on missing/unsafe env
│   │   ├── database/           DatabaseModule/Service — Knex pool + tx() helper (single seam)
│   │   ├── health/             GET /api/health (DB liveness probe)
│   │   └── categories/         GET /api/categories, /api/categories/:slug (DB-driven)
│   ├── db/
│   │   ├── migrations/         Knex migrations (versioned, reversible)
│   │   └── seeds/              reference data: Basic package, categories, admin
│   ├── scripts/dev-db.cjs      embedded PostgreSQL (npm) — zero system setup
│   ├── knexfile.cjs            DB config (loads server/.env)
│   └── .env                    secrets & config (gitignored)
├── docker-compose.yml          Postgres for Docker-based dev/deploys
└── package.json                workspace scripts (dev:client / dev:server / db:start / build)
```

**Why Knex instead of Prisma (Phase 1 note):** this environment blocks Prisma's binary CDN
(`binaries.prisma.sh`) and no npm-distributed engine binaries exist, which makes Prisma's
CLI (`generate`/`migrate`) unusable here. **Knex + `pg`** delivers the same guarantees —
versioned reversible migrations, transactions, typed query access — with zero external
binary dependencies. The data layer is isolated behind `DatabaseService`, so the driver can
be swapped (e.g. back to Prisma, or another) without touching any module.

**Database:** real **PostgreSQL 18** — embedded via npm for sandbox/dev
(`server/.data/pg`, gitignored, persistent), or your own instance / `docker-compose.yml`.
The API only consumes `DATABASE_URL`.

## Getting started

```bash
npm install                 # installs client + server workspaces

# 1) Database (Postgres 18, port 5433) — keep running in a terminal
npm run db:start

# 2) Schema + reference data
npm run db:migrate -w server
npm run db:seed -w server

# 3) API (port 4000)
npm run dev:server

# 4) Storefront (port 5173, proxies /api → 4000)
npm run dev:client
```

Useful: `npm run build` (both), `npm run typecheck` (both),
`npm run db:rollback -w server`.

## Environment variables

`server/.env` (copy from `.env.example`):

| Variable | Purpose |
| -------- | ------- |
| `PORT` | API port (default 4000) |
| `CORS_ORIGIN` | Comma-separated allowed origins for direct API access |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth (consumed from Phase 2) — must be a real secret in production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded super admin (bcrypt-hashed, never stored in plaintext) |

`client/.env.example`: `VITE_API_URL` (empty in dev — Vite proxies `/api`).

## Phase 1 details

**Files created (server):** module/config/database/health/categories sources,
`db/migrations/20260915000001_initial_schema.js`, `db/seeds/000001_reference_data.js`,
`knexfile.cjs`, `scripts/dev-db.cjs`, `nest-cli.json`, `.env(.example)`.
**Files changed (client):** moved into `client/`; `vite.config.ts` gained the `/api` proxy;
`client/.env.example` added. **Root:** workspaces `package.json`, `.gitignore`,
`docker-compose.yml`, this README.

**Database (migration 1):**
- `users` — id, name, email (unique), phone, password_hash (bcrypt), role
  (`user_role` enum: CUSTOMER/VENDOR/ADMIN), is_active, timestamps
- `categories` / `subcategories` — DB-driven catalog taxonomy (spec §40)
- `packages` — vendor subscription packages; **price/limits live in the DB, never
  hard-coded** (spec §5/§15). Seeded: `Basic` = 5,000 RWF, 20 products, 30 days.
- `audit_logs` — append-only trail (actor, action, entity, JSON metadata)

**API routes (Phase 1):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/health` | DB liveness probe; 503 when DB is down |
| GET | `/api/categories` | Active categories + active subcategories |
| GET | `/api/categories/:slug` | Single category (404 when missing) |

## Manual testing (Phase 1)

1. Start all three (db, server, client) as above.
2. Open the storefront (preview / `http://localhost:5173`) — the Phase-1 storefront still
   renders with its mock catalog (real API wiring lands with Phase 11).
3. `curl http://localhost:4000/api/health` → `{"status":"ok","database":"up",…}`.
4. `curl http://localhost:4000/api/categories` → 8 categories with subcategories.
5. `curl http://localhost:5173/api/health` → same JSON (proves the Vite `/api` proxy).
6. `curl -i http://localhost:4000/api/categories/does-not-exist` → `404`.
7. Stop Postgres (`Ctrl-C` in the `db:start` terminal), then `curl /api/health` → HTTP 503
   with `{"database":"down"}`. Restart Postgres → back to 200.
8. Check DB contents: `npm run db:studio -w server` (Prisma Studio would also work, but here:
   any Postgres client pointed at `127.0.0.1:5433`, user/db `market`).

## Roadmap (per spec §52)

Phases 2–18 follow the architecture doc exactly — auth → vendor registration (T&C modal,
self-set password) → payments → admin vendor management → packages/entitlements →
subscriptions → vendor dashboard & shops → products (images, variants) → **simple inventory**
→ public marketplace (API-wired) → vendor shops → cart → checkout → orders (vendor
sub-orders) → payments (provider-agnostic) → analytics/notifications/SEO → hardening.
