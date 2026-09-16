import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

/**
 * Owns the Knex (Postgres) connection pool.
 *
 * - Created from DATABASE_URL (no driver assumptions leak into services)
 * - Verified on boot, destroyed on shutdown (clean transactions, spec §51)
 * - `tx` runs a callback inside a DB transaction
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly knexInstance: Knex;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const url = config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env.');
    }
    this.knexInstance = knex({
      client: 'pg',
      connection: url,
      pool: { min: 1, max: 10 },
      useNullAsDefault: true,
    });
  }

  /** The typed Knex instance (query builder, raw, transactions). */
  get connection(): Knex {
    return this.knexInstance;
  }

  /** Run `fn` inside a database transaction (auto commit/rollback). */
  async tx<T>(fn: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.knexInstance.transaction(async (trx) => fn(trx));
  }

  async onModuleInit(): Promise<void> {
    await this.knexInstance.raw('SELECT 1');
  }

  async onModuleDestroy(): Promise<void> {
    await this.knexInstance.destroy();
  }
}
