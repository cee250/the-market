import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';

type RequestWithUser = Request & { user: AuthUser };

class CreatePaymentDto {
  @IsUUID()
  packageId!: string;

  @IsString()
  @MinLength(2)
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class ReviewPaymentDto {
  @IsIn(['VERIFIED', 'REJECTED'])
  decision!: 'VERIFIED' | 'REJECTED';

  @IsOptional()
  @IsString()
  reviewNote?: string;
}
class OrderPaymentDto { @IsString() @MinLength(2) provider!: string; }
class VerifyOrderPaymentDto { @IsIn(['PAID', 'FAILED']) status!: 'PAID' | 'FAILED'; @IsOptional() @IsString() providerReference?: string; @IsOptional() @IsString() failureReason?: string; }

@Controller('payments')
@UseGuards(AuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get('packages')
  @Roles('VENDOR', 'ADMIN')
  listPackages() {
    return this.payments.listPackages();
  }

  @Post('vendor')
  @Roles('VENDOR')
  createVendorPayment(@Req() request: RequestWithUser, @Body() body: CreatePaymentDto) {
    return this.payments.createPayment(request.user, body, request.ip, request.headers['user-agent']);
  }

  @Get('vendor')
  @Roles('VENDOR')
  listVendorPayments(@Req() request: RequestWithUser) {
    return this.payments.listForVendor(request.user);
  }

  @Get('admin')
  @Roles('ADMIN')
  listAdminPayments() {
    return this.payments.listForAdmin();
  }

  @Post('admin/:id/review')
  @Roles('ADMIN')
  @HttpCode(200)
  review(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: ReviewPaymentDto) {
    return this.payments.reviewPayment(request.user, id, body.decision, body.reviewNote);
  }

  @Post('orders/:id/intent')
  @Roles('CUSTOMER')
  createOrderIntent(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: OrderPaymentDto) { return this.payments.createOrderPayment(request.user, id, body.provider); }

  @Post('orders/:id/verify')
  @Roles('ADMIN')
  verifyOrder(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: VerifyOrderPaymentDto) { return this.payments.verifyOrderPayment(request.user, id, body.status, body.providerReference, body.failureReason); }
}
