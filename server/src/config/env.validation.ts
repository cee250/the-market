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
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  const corsOrigin = String(config.CORS_ORIGIN ?? '');
  if (nodeEnv === 'production') {
    if (jwtSecret.length < 32 || jwtSecret.includes('change-me')) {
      throw new Error('JWT_SECRET must be a strong, unique secret of at least 32 characters in production.');
    }
    if (!corsOrigin) throw new Error('CORS_ORIGIN must be explicitly configured in production.');
  } else if (!jwtSecret || jwtSecret.includes('change-me')) {
    // eslint-disable-next-line no-console
    console.warn('[config] WARNING: JWT_SECRET is not set to a real secret — do not use this for production.');
  }

  return {
    ...config,
    PORT: port,
    JWT_SECRET: jwtSecret || 'dev-only-secret-change-me-in-production',
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN ?? '15m',
    NODE_ENV: nodeEnv,
    CORS_ORIGIN: corsOrigin,
  };
}
