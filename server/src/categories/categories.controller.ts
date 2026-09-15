import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService, CategoryDto } from './categories.service';

/**
 * Public catalog endpoints (no auth required — browsing is open, spec §25).
 * Admin write endpoints arrive with the admin phases.
 */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  findAll(): Promise<CategoryDto[]> {
    return this.categories.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<CategoryDto> {
    return this.categories.findBySlug(slug);
  }
}
