import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly products: ProductsService) {}
  @Get('products') list(@Query() query: Record<string, string>) { return this.products.publicList({ search: query.search, categoryId: query.categoryId, vendorId: query.vendorId, location: query.location, condition: query.condition, minPrice: query.minPrice ? Number(query.minPrice) : undefined, maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined, sort: query.sort, page: query.page ? Number(query.page) : undefined, limit: query.limit ? Number(query.limit) : undefined }); }
  @Get('products/:slug') detail(@Param('slug') slug: string) { return this.products.publicBySlug(slug); }
}
