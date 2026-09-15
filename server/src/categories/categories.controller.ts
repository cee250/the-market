import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthUser } from '../auth/auth.service';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CategoriesService, CategoryDto } from './categories.service';

type RequestWithUser = Request & { user: AuthUser };
class CategoryDtoInput { @IsString() @MinLength(2) name!: string; @IsOptional() @IsString() description?: string; @IsOptional() @IsInt() @Min(0) sortOrder?: number; }
class SubcategoryDtoInput { @IsString() @MinLength(2) name!: string; @IsOptional() @IsInt() @Min(0) sortOrder?: number; }
class ActiveDto { @IsBoolean() isActive!: boolean; }

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll(): Promise<CategoryDto[]> { return this.categories.findAll(); }
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<CategoryDto> { return this.categories.findBySlug(slug); }

  @Post('admin')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Req() request: RequestWithUser, @Body() body: CategoryDtoInput) { return this.categories.createCategory(request.user, body); }
  @Post('admin/:id/subcategories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  createSubcategory(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: SubcategoryDtoInput) { return this.categories.createSubcategory(request.user, id, body); }
  @Patch('admin/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  toggle(@Req() request: RequestWithUser, @Param('id') id: string, @Body() body: ActiveDto) { return this.categories.setCategoryActive(request.user, id, body.isActive); }
}
