/**
 * Boot-time environment validation.
 * Fails fast with a clear message instead of crashing mid-request later.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required: string[] = ['DATABASE_URL'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}. Copy server/.env.example to server/.env and fill it in.`);
  }

  const port = Number(config.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be a valid port number, got: ${String(config.PORT)}`);
  }

  const jwtSecret = String(config.JWT_SECRET ?? '');
  if (!jwtSecret || jwtSecret.includes('change-me')) {
    // Phase 1 keeps the server running with a dev secret; warn loudly.
    // From Phase 2 (auth) this must become a hard failure in non-dev.
    // eslint-disable-next-line no-console
    console.warn('[config] WARNING: JWT_SECRET is not set to a real secret — do not use this for production.');
  }

  return {
    ...config,
    PORT: port,
    JWT_SECRET: jwtSecret || 'dev-only-secret-change-me-in-production',
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '15m',
    NODE_ENV: config.NODE_ENV ?? 'development',
  };
}
