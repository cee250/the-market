import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PackagesModule } from '../packages/packages.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  imports: [AuthModule, PackagesModule, SubscriptionsModule],
  controllers: [ShopsController],
  providers: [ShopsService],
})
export class ShopsModule {}
