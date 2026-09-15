import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PackagesModule } from '../packages/packages.module';
import { ProductsController } from './products.controller';
import { MarketplaceController } from './marketplace.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [AuthModule, PackagesModule],
  controllers: [ProductsController, MarketplaceController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
