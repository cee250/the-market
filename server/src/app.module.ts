import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { PackagesModule } from './packages/packages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ShopsModule } from './shops/shops.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    // Global config with env validation at boot (fail fast on missing vars)
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Global Postgres connection (Knex) — every module can inject DatabaseService
    DatabaseModule,
    AuthModule,
    HealthModule,
    CategoriesModule,
    PaymentsModule,
    PackagesModule,
    SubscriptionsModule,
    ShopsModule,
    ProductsModule,
    InventoryModule,
    VendorsModule,
  ],
})
export class AppModule {}
