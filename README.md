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
| **Phase 2** | **Authentication (roles, secure passwords, sessions, email verification, password reset)** | ✅ **Done** |
| **Phase 3** | **Vendor registration, password confirmation, Terms & Conditions acceptance** | ✅ **Done** |
| **Phase 4** | **Vendor payment/deal records, payment verification, admin payment interface** | ✅ **Done** |
| **Phase 5** | **Super Admin vendor management: activation, suspension, deactivation, reactivation** | ✅ **Done** |
| **Phase 6** | **Packages, product limits, vendor entitlements** | ✅ **Done** |
| **Phase 7** | **Subscription system: start/end dates, renewal history, countdown, expiration** | ✅ **Done** |
| **Phase 8** | **Vendor dashboard, vendor shop, profile, social links** | ✅ **Done** |
| **Phase 9** | **Product management, categories, product limits, publishing** | ✅ **Done** |
| **Phase 10** | **Product media, SKU, variants, availability, editing improvements** | ✅ **Done** |
| **Phase 11** | **Simple inventory, stock movements, sales, stock balance** | ✅ **Done** |
| **Phase 12** | **Cart, multi-vendor checkout, orders, stock reservation** | ✅ **Done** |
| Phase 13–18 | Payments, fulfillment, search → hardening | ⏳ Planned |

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
│   │   ├── auth/               secure cookie sessions, roles, verification, password reset
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

## Phase 2 details

Authentication is backed by bcrypt password hashes and opaque, HttpOnly cookie sessions. Session and one-time token values are stored only as SHA-256 digests. The API exposes login, registration, current-user, logout, email verification, and password-reset endpoints under `/api/auth`. Reset requests intentionally return the same response whether or not an email exists. In development, registration/reset responses include one-time tokens to support manual testing; these fields are omitted when `NODE_ENV=production`.

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

**API routes (Phase 2):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| POST | `/api/auth/register` | Creates a customer with a bcrypt password and session |
| POST | `/api/auth/login` | Validates credentials and sets an HttpOnly session cookie |
| POST | `/api/auth/logout` | Revokes the current session |
| GET | `/api/auth/me` | Returns the authenticated user |
| POST | `/api/auth/verify-email` | Consumes a one-time verification token |
| POST | `/api/auth/password-reset/request` | Generic response to prevent email enumeration |
| POST | `/api/auth/password-reset/confirm` | Consumes a one-time reset token and revokes sessions |

**API routes (Phase 3):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| POST | `/api/auth/register/vendor` | Creates a VENDOR profile in `PENDING_PAYMENT`, stores terms acceptance, and does not activate the account |

Vendor registrations require a business name, phone, location, matching user-created passwords, and an explicit Terms & Conditions version. The acceptance is stored with timestamp, IP address, and user agent. Vendor activation and subscription start remain reserved for later admin/payment phases.

**API routes (Phase 4):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/payments/packages` | Active package prices from the database |
| POST | `/api/payments/vendor` | Vendor records a payment/deal for review |
| GET | `/api/payments/vendor` | Vendor views their own payment records |
| GET | `/api/payments/admin` | Admin-only payment review queue |
| POST | `/api/payments/admin/:id/review` | Admin verifies or rejects a pending record |

Payment amounts are snapshotted from the selected package. Verifying a payment moves the vendor to `PENDING_APPROVAL`; it does not activate the vendor or start a subscription.

**API routes (Phase 5):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/vendors/admin` | Admin-only vendor management list |
| POST | `/api/vendors/admin/:id/action` | Admin-only activate, suspend, deactivate, or reactivate action |

The server validates allowed state transitions and writes every status change to `audit_logs`. Vendors cannot perform these actions themselves.

**API routes (Phase 6):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/packages/admin` | Admin-only package list |
| POST | `/api/packages/admin` | Admin-only package creation |
| PATCH | `/api/packages/admin/:id` | Admin-only package editing/activation |
| GET | `/api/packages/vendor/entitlement` | Vendor's effective package entitlement |

Vendor activation now requires a verified payment and grants a `vendor_entitlements` record containing the package's product limit. Deactivation revokes the entitlement. The server-side `PackagesService.assertCanPublishProduct(...)` helper rejects publishing beyond the entitlement limit; product publishing will consume this seam in the product phase.

**API routes (Phase 7):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/subscriptions/vendor` | Backend-authoritative subscription and renewal history |
| GET | `/api/subscriptions/admin` | Admin subscription overview |

Admin activation starts the subscription clock. The API calculates `ACTIVE`, `EXPIRING_SOON`, or `EXPIRED` from the stored end date and synchronizes an expired vendor to `EXPIRED` without deleting products or entitlements. The frontend countdown is display-only and is seeded from API-provided remaining seconds.

**API routes (Phase 8):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/shops/dashboard` | Authenticated vendor dashboard summary |
| GET | `/api/shops/me` | Authenticated vendor shop profile |
| PATCH | `/api/shops/me` | Vendor-owned shop and social-link updates |
| GET | `/api/shops/public/:slug` | Public active-shop profile; hidden for restricted statuses |

Shop edits are server-authorized and audited. Social links are normalized into their own table. Public shops currently return an empty product list because product CRUD begins in Phase 9.

**API routes (Phase 9):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/products/mine` | Vendor-owned product list |
| POST | `/api/products` | Create a draft product |
| PATCH | `/api/products/:id` | Edit an owned product |
| DELETE | `/api/products/:id` | Delete an owned product |
| POST | `/api/products/:id/publish` | Publish or unpublish with entitlement enforcement |
| POST | `/api/categories/admin` | Admin category creation |

Publishing requires an active vendor, an active subscription entitlement, and available product capacity. Public shops now expose only `PUBLISHED` products; drafts remain private to their vendor.

**API routes (Phase 10):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| POST | `/api/products/:id/images` | Add relational product images |
| DELETE | `/api/products/:id/images/:imageId` | Remove an owned image |
| POST | `/api/products/:id/images/reorder` | Reorder all product images |
| POST | `/api/products/:id/images/cover` | Select the cover image |
| GET | `/api/products/:id/variants` | List owned product variants |
| POST | `/api/products/:id/variants` | Add a SKU-backed variant |
| PATCH | `/api/products/:id/variants/:variantId` | Edit variant stock, price, options, or availability |
| DELETE | `/api/products/:id/variants/:variantId` | Delete an owned variant |

Product-level SKUs are unique per vendor, variant SKUs are unique per product, and all media/variant operations enforce vendor ownership.

**API routes (Phase 11):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/inventory` | Active vendor inventory items with calculated balances |
| GET | `/api/inventory/summary` | Inventory dashboard totals and low-stock items |
| POST | `/api/inventory` | Create an inventory item with optional opening stock |
| PATCH | `/api/inventory/:id` | Edit item metadata and threshold |
| DELETE | `/api/inventory/:id` | Archive an item |
| POST | `/api/inventory/:id/add-stock` | Record stock addition |
| POST | `/api/inventory/:id/record-sale` | Record a sale and prevent negative stock |
| POST | `/api/inventory/:id/adjust` | Apply a signed stock adjustment |
| GET | `/api/inventory/:id/movements` | View the append-only movement history |

Remaining stock is calculated as opening quantity plus additions and adjustments minus sales. Stock operations use a database transaction and row lock to prevent lost updates or negative balances.

**API routes (Phase 12):**

| Method | Route | Notes |
| ------ | ----- | ----- |
| GET | `/api/cart` | Authenticated customer's persisted cart |
| POST | `/api/cart/items` | Add a published product or variant |
| PATCH | `/api/cart/items/:id` | Change quantity |
| DELETE | `/api/cart/items/:id` | Remove a cart item |
| POST | `/api/checkout` | Create one order with vendor sub-orders |
| GET | `/api/orders` | Customer order history |

Checkout snapshots prices and selected options, groups items into vendor-specific sub-orders, clears the cart, and reserves matching inventory inside the same database transaction. Inventory reservation uses row locks and rejects insufficient stock.

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
