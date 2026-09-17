import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { AdminService } from './admin.service';
type RequestWithUser = Request & { user: AuthUser };
class AccountUpdateDto { @IsOptional() @IsString() @MinLength(2) name?: string; @IsOptional() @IsString() @MinLength(8) password?: string; }
@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController { constructor(private readonly admin: AdminService) {} @Get('stats') stats(@Req() request: RequestWithUser) { return this.admin.stats(request.user); } @Get('audit-logs') audit(@Req() request: RequestWithUser, @Query('page') page?: string, @Query('limit') limit?: string) { return this.admin.audit(request.user, Number(page || 1), Number(limit || 50)); } @Patch('account') account(@Req() request: RequestWithUser, @Body() body: AccountUpdateDto) { return this.admin.updateAccount(request.user, body); } }
