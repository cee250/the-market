import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { ProductsService } from './products.service';

type RequestWithUser = Request & { user: AuthUser };

class ProductDto {
  @IsString() @MinLength(2) name!: string;
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

@Controller('products')
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get('mine') mine(@Req() request: RequestWithUser) { return this.products.mine(request.user); }
  @Post() create(@Req() request: RequestWithUser, @Body() body: ProductDto) { return this.products.create(request.user, body); }
  @Patch(':id') update(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: ProductUpdateDto) { return this.products.update(request.user, id, body); }
  @Delete(':id') remove(@Req() request: RequestWithUser, @Param('id') id: string) { return this.products.remove(request.user, id); }
  @Post(':id/publish') publish(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: PublishDto) { return this.products.publish(request.user, id, body.status); }
}
