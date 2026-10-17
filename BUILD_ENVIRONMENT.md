# Build Environment Configuration

## Verified workspace

- Node.js: `v22.13.0`
- npm: `10.9.2`
- Package manager: npm workspaces
- Required Node engine: `>=20.19`
- Client: React 19, Vite 7, TypeScript, Tailwind CSS v4
- Server: NestJS 12, TypeScript, Knex, PostgreSQL

## Existing compiler configuration

### Client

`client/tsconfig.json` is configured for strict React/Vite TypeScript compilation with:

- ES2022 target and browser libraries
- ES module output and bundler module resolution
- React JSX transform
- strict type checking
- Vite client environment types through `client/src/vite-env.d.ts`
- no emitted JavaScript during typecheck

`client/vite.config.ts` provides the Vite React and Tailwind plugins, binds the development server to `0.0.0.0:5173`, and proxies `/api` to the NestJS server at `127.0.0.1:4000`.

### Server

`server/tsconfig.json` is configured for strict NestJS compilation with:

- CommonJS output for the Node runtime
- ES2022 target
- decorator and decorator-metadata support
- source maps
- `dist` output
- strict property and casing checks
- `src/**/*` inclusion with `node_modules` and `dist` excluded

`server/nest-cli.json` points NestJS CLI to `server/src` and the server TypeScript configuration.

## Dependency installation

The first plain `npm ci` attempt encountered a transient npm/OpenSSL cipher error while unpacking a cached package. The retry below completed successfully:

```bash
npm cache verify
npm ci --prefer-offline --no-audit --no-fund
```

The engine warnings are from transitive Angular DevKit packages used by the NestJS toolchain. They are warnings only under the current Node runtime and do not prevent compilation.

## Validation commands

All commands below passed after dependency installation:

```bash
npm run typecheck
npm run build
npm test
npm run release-readiness
```

Results:

- Client TypeScript check: passed
- Server TypeScript check: passed
- Client Vite production build: passed
- Server NestJS/TypeScript production build: passed
- Server tests: 11 passed, 0 failed
- Release-readiness checks: passed

## Development commands

```bash
npm run db:start
npm run db:migrate -w server
npm run db:seed -w server
npm run dev:server
npm run dev:client
```

The client development server runs on port `5173`; the API runs on port `4000` and exposes the `/api` prefix outside Netlify functions.

## Phase 2 build-environment acceptance

- [x] Workspace dependencies install reproducibly with npm workspaces.
- [x] Client TypeScript configuration resolves React, Vite, and `import.meta.env` types.
- [x] Server TypeScript configuration resolves NestJS decorators and Node runtime types.
- [x] Client production build succeeds.
- [x] Server production build succeeds.
- [x] Existing automated server tests pass.
- [x] Release-readiness checks pass.
- [ ] Add staging/production CI secrets and provider configuration separately; no secrets are committed in this phase.
