import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  api: 'up';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: { database: { status: 'up' | 'down'; latencyMs: number | null } };
}

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async check(): Promise<HealthResponse | never> {
    let database: 'up' | 'down' = 'up';
    let databaseLatencyMs: number | null = null;
    const startedAt = process.hrtime.bigint();
    try {
      await this.db.connection.raw('SELECT 1');
      databaseLatencyMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 10_000) / 100;
    } catch (error) {
      database = 'down';
      const databaseError = error as { code?: string; message?: string };
      console.error('[health] database check failed', {
        code: databaseError.code,
        message: databaseError.message?.slice(0, 180),
      });
    }

    const payload: HealthResponse = {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      api: 'up',
      version: process.env.APP_VERSION ?? '0.2.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database: { status: database, latencyMs: databaseLatencyMs } },
    };

    if (database === 'down') {
      throw new ServiceUnavailableException(payload);
    }
    return payload;
  }

  @Get('live')
  live() {
    return { status: 'ok', api: 'up', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async ready(): Promise<HealthResponse | never> {
    return this.check();
  }
}
