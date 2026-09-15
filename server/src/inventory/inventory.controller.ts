import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { InventoryService } from './inventory.service';

type RequestWithUser = Request & { user: AuthUser };
class InventoryDto { @IsString() @MinLength(2) name!: string; @IsOptional() @IsString() sku?: string; @IsOptional() @IsInt() @Min(0) openingQuantity?: number; @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number; @IsOptional() @IsString() productId?: string; @IsOptional() @IsString() variantId?: string; @IsOptional() @IsString() notes?: string; }
class StockDto { @IsInt() quantity!: number; @IsOptional() @IsString() note?: string; }
class AdjustDto { @IsInt() quantityDelta!: number; @IsOptional() @IsString() note?: string; }

@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get() list(@Req() request: RequestWithUser) { return this.inventory.list(request.user); }
  @Get('summary') summary(@Req() request: RequestWithUser) { return this.inventory.summary(request.user); }
  @Post() create(@Req() request: RequestWithUser, @Body() body: InventoryDto) { return this.inventory.create(request.user, body); }
  @Patch(':id') update(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: Partial<InventoryDto>) { return this.inventory.update(request.user, id, body); }
  @Delete(':id') archive(@Req() request: RequestWithUser, @Param('id') id: string) { return this.inventory.archive(request.user, id); }
  @Get(':id/movements') movements(@Req() request: RequestWithUser, @Param('id') id: string) { return this.inventory.movements(request.user, id); }
  @Post(':id/add-stock') addStock(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: StockDto) { return this.inventory.addStock(request.user, id, body.quantity, body.note); }
  @Post(':id/record-sale') sale(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: StockDto) { return this.inventory.recordSale(request.user, id, body.quantity, body.note); }
  @Post(':id/adjust') adjust(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: AdjustDto) { return this.inventory.adjust(request.user, id, body.quantityDelta, body.note); }
}
