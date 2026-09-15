import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { OrdersService } from './orders.service';

type RequestWithUser = Request & { user: AuthUser };
class CartItemDto { @IsString() productId!: string; @IsInt() @Min(1) quantity!: number; @IsOptional() @IsString() variantId?: string; @IsOptional() selectedOptions?: Record<string, unknown>; }
class QuantityDto { @IsInt() @Min(1) quantity!: number; }
class CheckoutDto { @IsString() @MinLength(2) customerName!: string; @IsString() @MinLength(5) phone!: string; @IsEmail() email!: string; @IsString() @MinLength(3) deliveryAddress!: string; @IsIn(['DELIVERY', 'PICKUP']) fulfillmentMethod!: 'DELIVERY' | 'PICKUP'; @IsString() @MinLength(2) paymentMethod!: string; }

@Controller()
@UseGuards(AuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get('cart') cart(@Req() request: RequestWithUser) { return this.orders.cart(request.user); }
  @Post('cart/items') add(@Req() request: RequestWithUser, @Body() body: CartItemDto) { return this.orders.add(request.user, body.productId, body.quantity, body.variantId, body.selectedOptions); }
  @Patch('cart/items/:id') quantity(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: QuantityDto) { return this.orders.updateQuantity(request.user, id, body.quantity); }
  @Delete('cart/items/:id') remove(@Req() request: RequestWithUser, @Param('id') id: string) { return this.orders.remove(request.user, id); }
  @Post('checkout') checkout(@Req() request: RequestWithUser, @Body() body: CheckoutDto) { return this.orders.checkout(request.user, body); }
  @Get('orders') listOrders(@Req() request: RequestWithUser) { return this.orders.orders(request.user); }
}
