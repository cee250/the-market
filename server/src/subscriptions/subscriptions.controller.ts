import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { SubscriptionsService } from './subscriptions.service';

type RequestWithUser = Request & { user: AuthUser };

@Controller('subscriptions')
@UseGuards(AuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Get('vendor')
  @Roles('VENDOR')
  vendor(@Req() request: RequestWithUser) { return this.subscriptions.getForVendor(request.user); }

  @Get('admin')
  @Roles('ADMIN')
  admin(@Req() request: RequestWithUser) { return this.subscriptions.listForAdmin(request.user); }
}
