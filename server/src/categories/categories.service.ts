import { Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../database/database.service';

export interface SubcategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subcategories: SubcategoryDto[];
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface SubcategoryRow {
  id: string;
  name: string;
  slug: string;
  category_id: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly db: DatabaseService) {}

  private toDto(row: CategoryRow, subs: SubcategoryRow[]): CategoryDto {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      subcategories: subs.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    };
  }

  private async loadSubcategories(categoryIds: string[]): Promise<Map<string, SubcategoryRow[]>> {
    const subs =
      categoryIds.length === 0
        ? []
        : ((await this.db.connection('subcategories')
            .whereIn('category_id', categoryIds)
            .where({ is_active: true })
            .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'name', order: 'asc' }])) as SubcategoryRow[]);

    const byCategory = new Map<string, SubcategoryRow[]>();
    for (const sub of subs) {
      const list = byCategory.get(sub.category_id) ?? [];
      list.push(sub);
      byCategory.set(sub.category_id, list);
    }
    return byCategory;
  }

  /** Active categories with their active subcategories, ordered for display. */
  async findAll(): Promise<CategoryDto[]> {
    const categories = (await this.db.connection('categories')
      .where({ is_active: true })
      .orderBy([{ column: 'sort_order', order: 'asc' }, { column: 'name', order: 'asc' }])) as CategoryRow[];

    const subMap = await this.loadSubcategories(categories.map((c) => c.id));
    return categories.map((c) => this.toDto(c, subMap.get(c.id) ?? []));
  }

  /** A single active category by slug (not found → 404). */
  async findBySlug(slug: string): Promise<CategoryDto> {
    const category = ((await this.db.connection('categories')
      .where({ slug, is_active: true })
      .first()) ?? null) as CategoryRow | null;

    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }

    const subMap = await this.loadSubcategories([category.id]);
    return this.toDto(category, subMap.get(category.id) ?? []);
  }
}
