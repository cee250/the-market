import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { VendorsService } from './vendors.service';

type RequestWithUser = Request & { user: AuthUser };

class VendorActionDto {
  @IsIn(['ACTIVATE', 'SUSPEND', 'DEACTIVATE', 'REACTIVATE'])
  action!: 'ACTIVATE' | 'SUSPEND' | 'DEACTIVATE' | 'REACTIVATE';

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('vendors')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get('admin')
  list(@Req() request: RequestWithUser) {
    return this.vendors.listVendors(request.user);
  }

  @Post('admin/:id/action')
  action(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: VendorActionDto) {
    return this.vendors.transition(request.user, id, body.action, body.note);
  }

  @Delete('admin/:id')
  remove(@Req() request: RequestWithUser, @Param('id') id: string) {
    return this.vendors.remove(request.user, id);
  }
}
