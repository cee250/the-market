import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
  api: 'up';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async check(): Promise<HealthResponse | never> {
    let database: 'up' | 'down' = 'up';
    try {
      await this.db.connection.raw('SELECT 1');
    } catch {
      database = 'down';
    }

    const payload: HealthResponse = {
      status: database === 'up' ? 'ok' : 'degraded',
      database,
      api: 'up',
      version: '0.2.0',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };

    if (database === 'down') {
      throw new ServiceUnavailableException(payload);
    }
    return payload;
  }
}
