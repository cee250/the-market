# Deployment and operations runbook

## Required production configuration

Set `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` before starting the API. `JWT_SECRET` must be a unique value with at least 32 characters, and `CORS_ORIGIN` must list the exact browser origins allowed to send credentialed requests. Set `ADMIN_PASSWORD` before running the initial seed; the documented development default is rejected in production.

## Release order

1. Build and verify the release with `npm ci`, `npm run typecheck`, `npm run build`, and `npm test`.
2. Apply database migrations with `npm run db:migrate -w server`.
3. Run the idempotent reference seed with `npm run db:seed -w server` only when reference data or the initial administrator is required.
4. Start the API with `npm run start -w server` and serve the client `client/dist` through the selected static host or CDN.

Never run destructive rollback commands automatically during deployment. Take a database backup before migrations and use `npm run db:rollback -w server` only as an explicitly reviewed recovery operation.

## Health checks

Use `GET /api/health/live` for a process-level liveness probe. Use `GET /api/health/ready` for readiness; it verifies the database connection and returns a service-unavailable response when the database is down. Route traffic only after readiness succeeds.

## Security and performance hardening

The API disables the Express `X-Powered-By` fingerprint and sends baseline browser protection headers including `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy`. Keep these headers intact at the reverse proxy layer. The client uses route-level code splitting so the initial storefront download is smaller; configure the static host to serve generated asset files and fall back to `index.html` only for application routes.

## Container builds

The API can be built with `docker build -f server/Dockerfile .`. The container requires the same production environment variables and an externally managed PostgreSQL database. The client remains a static Vite artifact and should be built with `npm run build -w client` and deployed to a static host with SPA fallback to `index.html`.

## Observability expectations

Collect structured reverse-proxy and API logs, monitor readiness failures, database connection saturation, HTTP 5xx rates, request latency, payment verification failures, and order creation failures. Alerts should page an operator for sustained readiness failure or elevated payment/order errors. Do not log passwords, session tokens, payment credentials, or full customer delivery details.
