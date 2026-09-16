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
EXPOSE 4000
CMD ["node", "server/dist/main.js"]
