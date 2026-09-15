import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Global data-access module. Every module injects DatabaseService —
 * the single seam where the SQL driver (Knex + Postgres) can be swapped.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
