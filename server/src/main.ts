import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const runningInNetlify = Boolean(process.env.NETLIFY || process.env.NETLIFY_FUNCTION_NAME);

  // Standalone deployments expose /api; the Netlify redirect strips /api before
  // invoking the function, so the function must mount controllers at root.
  if (!runningInNetlify) app.setGlobalPrefix('api');

  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.disable('x-powered-by');
  httpAdapter.use((request: Request, _response: Response, next: NextFunction) => {
    if (typeof request.body === 'string') {
      try {
        request.body = JSON.parse(request.body) as unknown;
      } catch {
        // Leave malformed bodies for the normal validation pipeline to reject.
      }
    }
    next();
  });
  httpAdapter.use((_request: unknown, response: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  httpAdapter.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    const startedAt = process.hrtime.bigint();
    response.setHeader('X-Request-Id', requestId);
    if (request.path.startsWith('/api/') || runningInNetlify) response.setHeader('Cache-Control', 'no-store');
    if (isProduction) response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    response.on('finish', () => {
      if (!isProduction) return;
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      console.log(JSON.stringify({ event: 'http_request', requestId, method: request.method, path: request.path, status: response.statusCode, durationMs: Math.round(durationMs * 100) / 100 }));
    });
    next();
  });

  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });
  const rateLimitWindowMs = config.get<number>('RATE_LIMIT_WINDOW_MS') ?? 60_000;
  const rateLimitMax = config.get<number>('RATE_LIMIT_MAX') ?? 10;
  const attempts = new Map<string, { count: number; resetAt: number }>();
  httpAdapter.use('/auth', (request: Request, response: Response, next: NextFunction) => {
    if (request.method === 'GET') return next();
    const key = `${request.ip ?? 'unknown'}:${request.path}`;
    const now = Date.now();
    const current = attempts.get(key);
    const bucket = current && current.resetAt > now ? current : { count: 0, resetAt: now + rateLimitWindowMs };
    bucket.count += 1;
    attempts.set(key, bucket);
    if (attempts.size > 10_000) for (const [entryKey, entry] of attempts) if (entry.resetAt <= now) attempts.delete(entryKey);
    response.setHeader('X-RateLimit-Limit', String(rateLimitMax));
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, rateLimitMax - bucket.count)));
    if (bucket.count > rateLimitMax) {
      response.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return response.status(429).json({ statusCode: 429, message: 'Too many authentication attempts. Try again later.' });
    }
    return next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`[api] Market API listening on http://0.0.0.0:${port}/api`);
}

if (!process.env.NETLIFY && !process.env.NETLIFY_FUNCTION_NAME) void bootstrap();
