import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsOptional, IsString, IsUrl, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { ShopsService } from './shops.service';

type RequestWithUser = Request & { user: AuthUser };

class SocialLinkDto {
  @IsString()
  platform!: string;

  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url!: string;
}

class UpdateShopDto {
  @IsOptional() @IsString() @MinLength(2) businessName?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MinLength(3) phone?: string;
  @IsOptional() @IsString() @MinLength(2) location?: string;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) logoUrl?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SocialLinkDto) socialLinks?: SocialLinkDto[];
}

@Controller('shops')
export class ShopsController {
  constructor(private readonly shops: ShopsService) {}

  @Get('public/:slug')
  public(@Param('slug') slug: string) { return this.shops.publicShop(slug); }

  @Get('dashboard')
  @UseGuards(AuthGuard)
  dashboard(@Req() request: RequestWithUser) { return this.shops.dashboard(request.user); }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: RequestWithUser) { return this.shops.getOwn(request.user); }

  @Patch('me')
  @UseGuards(AuthGuard)
  update(@Req() request: RequestWithUser, @Body() body: UpdateShopDto) { return this.shops.updateOwn(request.user, body); }
}
