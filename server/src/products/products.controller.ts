import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { ProductsService } from './products.service';

type RequestWithUser = Request & { user: AuthUser };

class ProductDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() @MinLength(2) sku?: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subcategoryId?: string;
  @IsString() @MinLength(2) location!: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() availability?: string;
  @IsOptional() @IsArray() @IsUrl({}, { each: true }) imageUrls?: string[];
}

class ProductUpdateDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() @MinLength(2) sku?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() subcategoryId?: string;
  @IsOptional() @IsString() @MinLength(2) location?: string;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @IsString() availability?: string;
  @IsOptional() @IsArray() @IsUrl({}, { each: true }) imageUrls?: string[];
}

class PublishDto {
  @IsString() status!: 'DRAFT' | 'PUBLISHED';
}

class ImagesDto { @IsArray() @IsUrl({}, { each: true }) urls!: string[]; }
class ImageOrderDto { @IsArray() @IsString({ each: true }) imageIds!: string[]; }
class CoverDto { @IsString() imageId!: string; }
class VariantDto { @IsString() @MinLength(2) sku!: string; @IsOptional() @IsString() color?: string; @IsOptional() @IsString() size?: string; @IsOptional() @IsString() storage?: string; @IsOptional() @IsString() model?: string; @IsOptional() @IsInt() @Min(0) price?: number; @IsInt() @Min(0) stock!: number; @IsOptional() @IsString() availability?: string; @IsOptional() isActive?: boolean; }

@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('mine') mine(@Req() request: RequestWithUser) { return this.products.mine(request.user); }
  @Post() create(@Req() request: RequestWithUser, @Body() body: ProductDto) { return this.products.create(request.user, body); }
  @Patch(':id') update(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: ProductUpdateDto) { return this.products.update(request.user, id, body); }
  @Delete(':id') remove(@Req() request: RequestWithUser, @Param('id') id: string) { return this.products.remove(request.user, id); }
  @Post(':id/publish') publish(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: PublishDto) { return this.products.publish(request.user, id, body.status); }
  @Post(':id/images') addImages(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: ImagesDto) { return this.products.addImages(request.user, id, body.urls); }
  @Delete(':id/images/:imageId') deleteImage(@Req() request: RequestWithUser, @Param('id') id: string, @Param('imageId') imageId: string) { return this.products.deleteImage(request.user, id, imageId); }
  @Post(':id/images/reorder') reorderImages(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: ImageOrderDto) { return this.products.reorderImages(request.user, id, body.imageIds); }
  @Post(':id/images/cover') coverImage(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: CoverDto) { return this.products.setCoverImage(request.user, id, body.imageId); }
  @Get(':id/variants') variants(@Req() request: RequestWithUser, @Param('id') id: string) { return this.products.variants(request.user, id); }
  @Post(':id/variants') createVariant(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: VariantDto) { return this.products.createVariant(request.user, id, body); }
  @Patch(':id/variants/:variantId') updateVariant(@Req() request: RequestWithUser, @Param('id') id: string, @Param('variantId') variantId: string, @Body() body: Partial<VariantDto>) { return this.products.updateVariant(request.user, id, variantId, body); }
  @Delete(':id/variants/:variantId') deleteVariant(@Req() request: RequestWithUser, @Param('id') id: string, @Param('variantId') variantId: string) { return this.products.deleteVariant(request.user, id, variantId); }
}
