import { Body, Controller, Get, Patch, Post, Param, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { PackagesService } from './packages.service';

type RequestWithUser = Request & { user: AuthUser };

class PackageDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(0) price!: number;
  @IsString() @MinLength(3) currency!: string;
  @IsInt() @Min(1) productLimit!: number;
  @IsInt() @Min(1) durationDays!: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class PackageUpdateDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) price?: number;
  @IsOptional() @IsString() @MinLength(3) currency?: string;
  @IsOptional() @IsInt() @Min(1) productLimit?: number;
  @IsOptional() @IsInt() @Min(1) durationDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('packages')
@UseGuards(AuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  @Get('admin')
  @Roles('ADMIN')
  list(@Req() request: RequestWithUser) { return this.packages.list(request.user); }

  @Post('admin')
  @Roles('ADMIN')
  create(@Req() request: RequestWithUser, @Body() body: PackageDto) { return this.packages.create(request.user, body); }

  @Patch('admin/:id')
  @Roles('ADMIN')
  update(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: PackageUpdateDto) { return this.packages.update(request.user, id, body); }

  @Get('vendor/entitlement')
  @Roles('VENDOR')
  entitlement(@Req() request: RequestWithUser) { return this.packages.getVendorEntitlement(request.user); }
}
