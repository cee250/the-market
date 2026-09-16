import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { NotificationsService } from './notifications.service';

type RequestWithUser = Request & { user: AuthUser };

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get()
  list(@Req() request: RequestWithUser) { return this.notifications.list(request.user); }
  @Patch(':id/read')
  read(@Req() request: RequestWithUser, @Param('id') id: string) { return this.notifications.markRead(request.user, id); }
  @Patch('read-all')
  readAll(@Req() request: RequestWithUser) { return this.notifications.markAllRead(request.user); }
}
