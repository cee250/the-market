# Demo Data and Local State Audit

**Audit date:** 2026-10-17  
**Repository:** `cee250/the-market`  
**Scope:** `client/src` and `server/src`

## Summary

The NestJS backend has real modules for authentication, categories, products, orders, payments, inventory, fulfillment, vendors, shops, analytics, notifications, packages, subscriptions, and admin operations. The primary demo-data problem is in the React client: several storefront and workspace services still return hard-coded data or persist business records in browser `localStorage`.

The current application can compile successfully, but compilation does not mean these flows are production-backed. The items below must be migrated to API/database sources before launch.

## Critical demo-backed files

| File | Demo/local behavior | Affected behavior | Priority | Replacement |
|---|---|---|---|---|
| `client/src/services/demoData.ts` | Hard-coded categories, subcategories, 20 products, prices, stock, ratings, images, specs, and dates | Home, catalog, product detail, search, related products, category navigation | P0 | Categories and products API backed by PostgreSQL; media storage URLs from the API |
| `client/src/services/api.ts` | `getCategories`, `getProduct`, and related products read `demoData`; product search delegates to demo marketplace | Main storefront catalog and product pages | P0 | One typed catalog client with pagination, filters, sorting, and error handling |
| `client/src/services/marketplace.ts` | Search and product lookup use `demoProducts`; reviews use localStorage plus a hard-coded review from “Aline M.” | Search suggestions, product reviews, product discovery | P0 | Marketplace search endpoint and verified-review endpoints |
| `client/src/services/auth.ts` | The current authentication request functions are real API calls; obsolete demo account/session helpers remain in the file | Account behavior and future maintenance risk | P1 cleanup | Delete unused `DemoAccount`, `ACCOUNT_KEY`, `SESSION_KEY`, and helper functions after confirming no caller uses them |
| `client/src/services/orders.ts` | Orders are stored in localStorage; cart methods return an empty `demo-cart`; checkout returns a generated ID without creating a server order | Cart, checkout, order history, order detail, order success | P0 | Server cart, transactional checkout, payment intent, order and vendor-order APIs |
| `client/src/services/products.ts` | Categories/products, product creation, editing, publishing, variants, and some media metadata are stored in localStorage; seed products are generated from demo data | Vendor products, admin categories, product publishing | P0 | Existing products/categories endpoints plus complete CRUD/media/variant endpoints |
| `client/src/services/seller.ts` | Seller orders are seeded in code and persisted in localStorage; analytics are calculated from seeded orders | Vendor dashboard, seller analytics, revenue, recent orders | P0 | Vendor-scoped order and analytics API using real paid/order data |
| `client/src/services/adminModeration.ts` | Moderation decisions are stored in localStorage; listings come from local products; seller is always “Demo seller”; customer accounts are hard-coded as `128`; category totals are calculated from demo categories | Admin moderation and platform analytics | P0 | Admin moderation/status API, real seller relations, database aggregates |

## Demo data references outside services

| File | Reference | Required action |
|---|---|---|
| `client/src/components/product/CategoryGrid.tsx` | Imports `demoSubcategories` directly | Fetch subcategories from the categories API; keep presentation component data-agnostic |
| `client/src/pages/ListingPage.tsx` | Imports `demoSubcategories` for filters/sidebar | Use category response or a dedicated subcategory query |
| `client/src/pages/AdminModerationPage.tsx` | Displays demo admin credentials in unauthorized state | Remove demo credentials from user-facing production UI; show a generic access message |
| `client/src/pages/VendorDashboardPage.tsx` | Uses `/shop/demo-seller` and text such as “local demo inventory” | Use the authenticated vendor shop route and real vendor data |
| `client/src/pages/VendorRegistrationPage.tsx` | Persists selected package in `market_vendor_package` localStorage | Use the server-created vendor registration/payment state; do not use browser storage as the source of truth |
| `client/src/hooks/useLocalStorage.ts` | Generic browser persistence hook | Retain only for non-business preferences such as theme, dismissed UI, or guest-only convenience state; never use for authoritative commerce records |

## LocalStorage keys currently identified

- `market.demo.accounts.v1` — obsolete demo accounts
- `market.demo.session.v1` — obsolete demo session
- `market.demo.reviews.v1` — demo/local reviews
- `market.orders.v1` — local customer orders
- `market.demo.posting.categories.v1` — local vendor/admin categories
- `market.demo.posting.products.v1` — local vendor products
- `market.demo.seller.orders.v1` — seeded vendor orders
- `market.demo.moderation.v1` — local moderation decisions
- `market_vendor_package` — vendor registration package selection

## Backend seed distinction

`server/db/seeds/000001_reference_data.js` and `server/scripts/e2e-smoke.cjs` are not frontend demo-data sources. They are development/release fixtures and reference data. They should remain idempotent and safe, but production deployment must not seed fake customers, orders, products, payments, or analytics records.

## Recommended migration order

1. Replace catalog reads: `demoData.ts` → categories/products/marketplace API.
2. Replace cart, checkout, and order persistence: `orders.ts` → server-backed cart/order/payment flow.
3. Replace vendor product/category state: `products.ts` → authenticated vendor/admin APIs.
4. Replace seller seeded orders and analytics: `seller.ts` → vendor-scoped API aggregates.
5. Replace reviews and moderation: `marketplace.ts` and `adminModeration.ts` → authenticated server endpoints.
6. Remove direct demo imports from UI components/pages.
7. Remove obsolete localStorage business keys and add a migration/cleanup notice for existing browser users.
8. Keep localStorage only for theme preference and non-authoritative UX preferences.

## Phase 1 acceptance criteria

- [x] Every client file containing demo/localStorage business data is listed above.
- [x] Every direct UI import of `demoData` is listed above.
- [x] Every known business-related localStorage key is listed above.
- [x] Backend reference seeds are distinguished from client demo data.
- [ ] No demo-backed service is used by a production route; this is the next implementation step.
