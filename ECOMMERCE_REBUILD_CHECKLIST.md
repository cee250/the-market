# Market E-Commerce Rebuild Checklist

## Repository assessment

**Current stack:** React 19 + Vite + TypeScript + Tailwind v4 storefront; NestJS 12 + Knex + PostgreSQL API; npm-workspaces monorepo.

**Already present:** customer authentication endpoints, vendor onboarding, vendor subscriptions/packages, product/category/inventory/order/payment/fulfillment modules, admin operations, moderation, analytics, notifications, SEO helpers, CI/release checks, Docker and Netlify deployment configuration.

**Main gap:** the storefront still mixes real API calls with demo/localStorage services. Several customer-facing flows, reviews, wishlist/compare/cart state, admin moderation data, and seller analytics are still demo-backed. The visual system is primarily hard-coded light-mode Tailwind classes, with a vendor-only dark override rather than a complete application theme system.

**Baseline note:** the local checkout currently cannot run typecheck because dependencies have not been installed in this clone (`node_modules` is absent). Run `npm ci` before treating the TypeScript/build result as a code-quality signal.

---

## Phase 0 — Product decisions and scope lock

- [ ] Confirm marketplace model: platform-owned catalog, multi-vendor marketplace, or both.
- [ ] Define supported countries, currency/currencies, tax rules, delivery regions, and business/legal entity.
- [ ] Define roles and permissions: guest, customer, vendor, support agent, operations manager, finance manager, administrator, super administrator.
- [ ] Define the order lifecycle and allowed transitions: pending payment, paid, processing, packed, shipped, delivered, cancelled, returned, refunded, disputed.
- [ ] Define vendor approval, subscription/package, commission, payout, and moderation rules.
- [ ] Define MVP versus later features so implementation is delivered phase by phase without mixing unfinished features into production.
- [ ] Create a data ownership map: which data is authoritative in PostgreSQL, which is cached in the browser, and which comes from payment/shipping providers.

**Exit criteria:** approved product rules, role matrix, order-state diagram, payment/refund policy, and prioritized backlog.

## Phase 1 — Repository and architecture baseline

- [ ] Install dependencies with `npm ci`.
- [ ] Run and record `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:e2e:smoke`.
- [ ] Inventory every frontend service and label it `REAL_API`, `DEMO`, `LOCAL_STORAGE`, or `HYBRID`.
- [ ] Remove or isolate demo-only services and seed data from production code paths.
- [ ] Establish API response/error conventions, pagination conventions, validation conventions, and request correlation IDs.
- [ ] Add environment separation for local, staging, and production databases/providers.
- [ ] Add database backup/restore and migration procedures before changing production schema.
- [ ] Add a route manifest (`/manus-routes.json`) and keep it synchronized with all storefront, vendor, and admin routes.

**Exit criteria:** clean baseline checks after dependencies are installed, documented service map, repeatable local setup, and no accidental production use of demo data.

## Phase 2 — Complete authentication, accounts, and authorization

- [ ] Replace frontend demo account/session logic in `client/src/services/auth.ts` with the real `/api/auth` flow everywhere.
- [ ] Verify registration, login, logout, current-user session restoration, email verification, and password reset end to end.
- [ ] Add account profile editing: name, email, phone, avatar, locale, currency, notification preferences.
- [ ] Add customer address book with default shipping and billing addresses.
- [ ] Add change-password and active-session/device management.
- [ ] Enforce email verification where required before checkout, selling, or payouts.
- [ ] Add server-side role/permission guards to every vendor/admin route; never rely on hidden frontend links.
- [ ] Add account deletion/deactivation and privacy-data export workflows.
- [ ] Set secure production cookie attributes correctly for HTTPS preview and deployment.
- [ ] Add rate limits, brute-force protection, audit logging, and non-enumerating auth errors.

**Exit criteria:** a new user can create and manage an account from any device, sessions are server-backed, and every protected action is authorized server-side.

## Phase 3 — Real catalog, media, and product management

- [ ] Make PostgreSQL the only source of truth for categories, subcategories, brands, products, variants, SKUs, prices, images, attributes, and availability.
- [ ] Replace `demoData` reads in catalog/product/listing pages with paginated API queries.
- [ ] Implement product creation/editing with full fields: title, slug, description, category, brand, attributes, variants, SKU, price, compare-at price, cost, tax class, dimensions, weight, stock policy, status.
- [ ] Implement image upload, validation, resizing/optimization, ordering, cover image, alt text, and deletion through managed storage.
- [ ] Add product drafts, scheduled publishing, unpublishing, moderation status, rejection reasons, and revision history.
- [ ] Add unique slug/SKU validation and safe product deletion/archive behavior.
- [ ] Add related products, recommendations, recently viewed items, and configurable merchandising slots.
- [ ] Define product review eligibility so only customers with completed orders can review.

**Exit criteria:** customers see database-backed products only; vendors can manage real listings and media; admins can moderate and audit changes.

## Phase 4 — Search, discovery, navigation, and SEO

- [ ] Replace client-side demo filtering with API-backed search, pagination, sorting, filtering, and category navigation.
- [ ] Support filters for category, subcategory, brand, price, rating, availability, vendor, location, attributes, and delivery options.
- [ ] Add debounced search, empty states, loading states, error recovery, and shareable query URLs.
- [ ] Add canonical URLs, product/category/vendor metadata, Open Graph previews, sitemap, robots rules, and structured product data.
- [ ] Ensure important catalog content is crawler-visible and not dependent on client-only placeholder data.
- [ ] Add analytics events for search, filter use, product views, add-to-cart, and conversion.

**Exit criteria:** a customer can reliably discover any published product and search/category URLs are indexable and shareable.

## Phase 5 — Cart, checkout, payments, and order creation

- [ ] Move cart persistence from browser-only state to an authenticated server cart; retain a guest cart and merge it after login.
- [ ] Validate product price, stock, vendor status, promotions, delivery eligibility, and totals on the server at checkout.
- [ ] Support saved addresses, delivery method, pickup/delivery options, contact details, order notes, and invoice details.
- [ ] Integrate a real payment provider appropriate for the target market; do not collect or store raw card data in the application.
- [ ] Implement payment intents/checkout sessions, signed webhooks, idempotency keys, retries, and reconciliation.
- [ ] Add payment methods and statuses such as pending, authorized, paid, failed, expired, refunded, and partially refunded.
- [ ] Create orders transactionally with stock reservation and release/expiry handling.
- [ ] Support multi-vendor checkout while creating vendor-order splits under one customer order.
- [ ] Send confirmation email/SMS/in-app notification only after authoritative order/payment state is known.
- [ ] Add customer invoices/receipts and admin payment reconciliation.

**Exit criteria:** a real customer can check out with a real payment, receive a durable order, and recover safely from duplicate requests, payment failures, and webhook retries.

## Phase 6 — Inventory, fulfillment, delivery, returns, and refunds

- [ ] Make stock quantities, reservations, adjustments, low-stock thresholds, and stock movements fully database-backed.
- [ ] Prevent overselling with transactional reservation/locking rules.
- [ ] Add vendor fulfillment queues and vendor-order isolation.
- [ ] Add shipment records, tracking numbers, carrier/service, package details, fulfillment timestamps, and delivery proof where required.
- [ ] Add customer order tracking timeline and notification preferences.
- [ ] Add cancellation, return request, exchange, refund, partial refund, and dispute workflows with policy windows.
- [ ] Reconcile inventory and payment effects for every cancellation, return, and refund transition.
- [ ] Add support/admin tools for manual state correction with mandatory audit reasons.

**Exit criteria:** every order has traceable inventory, payment, fulfillment, delivery, return, and refund history.

## Phase 7 — Customer account and retention features

- [ ] Replace localStorage wishlist with a server-backed wishlist synced across devices.
- [ ] Replace localStorage compare/recently-viewed state with a safe account/guest strategy.
- [ ] Add customer order history, order detail, reorder, invoice download, and support contact.
- [ ] Add verified product ratings/reviews, review moderation, vendor responses, and abuse reporting.
- [ ] Add promotions/coupons with server-side eligibility, usage limits, expiry, per-customer rules, and auditability.
- [ ] Add favorites for vendors/shops if marketplace strategy requires it.
- [ ] Add transactional notifications for verification, order changes, shipping, delivery, refund, and security events.

**Exit criteria:** customer activity persists beyond one browser and post-purchase support/retention flows are usable.

## Phase 8 — Vendor platform completion

- [ ] Finish vendor onboarding, identity/business verification, terms acceptance, approval, suspension, and reactivation.
- [ ] Add vendor profile/storefront settings, branding, business details, delivery settings, and policies.
- [ ] Add product, variant, media, inventory, pricing, order, fulfillment, and customer-service workflows.
- [ ] Add vendor analytics based on real order/payment data, not seeded/localStorage demo orders.
- [ ] Add commission calculation, fees, payout balance, payout schedule, payout status, and payout history.
- [ ] Add vendor invoices/statements and tax/business reporting where required.
- [ ] Ensure vendors cannot access another vendor's products, inventory, customers, orders, or financial records.

**Exit criteria:** an approved vendor can operate a real shop from onboarding through listing, sale, fulfillment, and payout.

## Phase 9 — Admin/control-center completion

- [ ] Build one coherent admin shell with navigation, global search, filters, tables, bulk actions, pagination, and export.
- [ ] Add dashboards for GMV, orders, customers, vendors, products, conversion, refunds, payment failures, and platform revenue.
- [ ] Add customer management, account actions, support notes, and audit history.
- [ ] Add vendor approval, suspension, verification, packages/subscriptions, commissions, payouts, and disputes.
- [ ] Add catalog/category/brand/attribute management and product moderation queues.
- [ ] Add order/payment/refund/shipping operations and reconciliation views.
- [ ] Add promotion/coupon/content/banner management.
- [ ] Add configurable platform settings without hard-coding business rules into the UI.
- [ ] Add fine-grained admin permissions and immutable audit trails for sensitive actions.

**Exit criteria:** administrators can operate the marketplace without database edits, localStorage state, or developer intervention.

## Phase 10 — Complete light/dark design system and background replacement

- [ ] Replace hard-coded colors such as `bg-white`, `bg-slate-*`, `text-slate-*`, and the vendor-only CSS override with semantic design tokens.
- [ ] Add a theme provider supporting light, dark, and system modes; persist the preference and respect `prefers-color-scheme`.
- [ ] Define tokens for page background, surface, elevated surface, text, muted text, border, brand, success, warning, danger, focus, and overlays.
- [ ] Design and implement a new branded background treatment for both modes; use subtle layered gradients/patterns or an optimized background asset, not a flat default white/black canvas.
- [ ] Ensure the new background works behind the storefront, customer account pages, checkout, vendor workspace, and admin workspace.
- [ ] Audit every page for contrast, hover/focus/disabled states, form controls, tables, dialogs, drawers, skeletons, toasts, and empty states in both themes.
- [ ] Add accessible focus indicators, reduced-motion support, keyboard navigation, readable contrast, and minimum touch targets.
- [ ] Remove conflicting vendor-specific overrides and make vendor/admin/customer surfaces use the same token system with intentional density differences.
- [ ] Add visual regression snapshots for key routes in light and dark themes.

**Exit criteria:** every route is visually coherent and accessible in light, dark, and system modes; no page falls back to unreadable hard-coded colors.

## Phase 11 — Quality, security, performance, and observability

- [ ] Add unit tests for pricing, discounts, permissions, stock reservation, order transitions, payment webhooks, refunds, and payout calculations.
- [ ] Add API integration tests for each role and critical failure path.
- [ ] Add browser E2E tests for registration, login, browse, cart, checkout, payment callback, order tracking, vendor listing, and admin moderation.
- [ ] Run dependency/security audits and fix high-severity findings.
- [ ] Add CSRF/session protections, secure headers, input validation, upload limits, malware/content checks, and PII-safe logs.
- [ ] Add database indexes, query pagination, caching where appropriate, image optimization, code splitting, and performance budgets.
- [ ] Add structured logs, metrics, tracing/request IDs, uptime checks, alerting, and payment/order failure dashboards.
- [ ] Verify backup restore, migration rollback/recovery procedure, and incident runbook.

**Exit criteria:** critical flows are automated, observable, recoverable, secure, and meet agreed performance budgets.

## Phase 12 — Staging, launch, and post-launch hardening

- [ ] Provision staging with production-like PostgreSQL, storage, email/SMS, payment sandbox, and deployment configuration.
- [ ] Run migrations and seed only safe reference data; never seed demo customer/orders into production.
- [ ] Complete UAT with guest, customer, vendor, support, admin, and finance personas.
- [ ] Verify domain, HTTPS, CORS, cookie behavior, webhooks, email delivery, storage permissions, backups, and monitoring.
- [ ] Perform a launch rehearsal with rollback and payment reconciliation.
- [ ] Launch behind feature flags or a controlled rollout.
- [ ] Monitor checkout conversion, 5xx rate, payment failures, stock/order errors, latency, and support volume.
- [ ] Remove demo credentials, demo copy, test payment placeholders, localStorage business data, and unused feature flags.
- [ ] Freeze the release, tag the version, publish the runbook, and create the post-launch hardening backlog.

**Exit criteria:** production is serving real catalog, accounts, payments, orders, vendors, and admin operations with monitoring and a tested recovery path.

---

## Recommended implementation order for this repository

1. **Phase 0–1:** decisions, baseline, and demo/real data map.
2. **Phase 2:** accounts and authorization.
3. **Phase 3–4:** real catalog, media, search, and SEO.
4. **Phase 5–6:** checkout, payments, inventory, fulfillment, returns.
5. **Phase 7–9:** customer, vendor, and admin completion.
6. **Phase 10:** global redesign and light/dark background/theme system.
7. **Phase 11–12:** quality gates, staging, launch, and hardening.

The visual redesign should begin with tokens and layout primitives in Phase 1, but the full page-by-page theme conversion belongs in Phase 10 so it is not repeatedly redone while real data and workflows are being wired in.

## Immediate next sprint

- [ ] Run `npm ci` and repeat all baseline checks.
- [ ] Create a `REAL_API / DEMO / LOCAL_STORAGE` service inventory for every file under `client/src/services`.
- [ ] Add a single API client with typed errors, auth credentials, request IDs, and consistent pagination.
- [ ] Replace demo catalog reads in home, listing, product, and category pages with API-backed reads.
- [ ] Replace demo/localStorage authentication with the server session flow everywhere.
- [ ] Define the semantic theme token file and add light/dark/system switching before converting page classes.
- [ ] Add staging environment documentation and a safe test-data reset strategy.
