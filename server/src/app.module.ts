import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Global config with env validation at boot (fail fast on missing vars)
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Global Postgres connection (Knex) — every module can inject DatabaseService
    DatabaseModule,
    HealthModule,
    CategoriesModule,
  ],
})
export class AppModule {}
