import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { AnalyticsService } from './analytics.service';

type RequestWithUser = Request & { user: AuthUser };

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('vendor')
  vendor(@Req() request: RequestWithUser) { return this.analytics.vendor(request.user); }

  @Get('admin')
  admin(@Req() request: RequestWithUser) { return this.analytics.admin(request.user); }
}
