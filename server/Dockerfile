FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm ci
COPY . .
RUN npm run build -w server

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/server/package*.json server/
RUN npm ci --omit=dev --workspace server --include-workspace-root
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/db server/db
COPY --from=build /app/server/knexfile.cjs server/knexfile.cjs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health/live').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "server/dist/main.js"]
