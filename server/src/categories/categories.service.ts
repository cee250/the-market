import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../auth/auth.service';

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

  async createCategory(admin: AuthUser, input: { name: string; description?: string; sortOrder?: number }) {
    this.assertAdmin(admin);
    const slug = this.slug(input.name);
    try {
      const [row] = await this.db.connection('categories').insert({ name: input.name.trim(), slug, description: input.description?.trim() || null, sort_order: input.sortOrder ?? 0 }).returning('*');
      return this.toDto(row, []);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Category already exists');
      throw error;
    }
  }

  async createSubcategory(admin: AuthUser, categoryId: string, input: { name: string; sortOrder?: number }) {
    this.assertAdmin(admin);
    const category = await this.db.connection('categories').where({ id: categoryId }).first();
    if (!category) throw new NotFoundException('Category not found');
    try {
      const [row] = await this.db.connection('subcategories').insert({ category_id: categoryId, name: input.name.trim(), slug: this.slug(input.name), sort_order: input.sortOrder ?? 0 }).returning('*');
      return { id: row.id, name: row.name, slug: row.slug, categoryId };
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Subcategory already exists');
      throw error;
    }
  }

  async setCategoryActive(admin: AuthUser, id: string, isActive: boolean) {
    this.assertAdmin(admin);
    const updated = await this.db.connection('categories').where({ id }).update({ is_active: isActive, updated_at: this.db.connection.fn.now() });
    if (!updated) throw new NotFoundException('Category not found');
    return { id, isActive };
  }

  private assertAdmin(user: AuthUser) { if (user.role !== 'ADMIN') throw new ForbiddenException('Only admins can manage categories'); }
  private slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
}
