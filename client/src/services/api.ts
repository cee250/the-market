import type { Product } from '../types';
import { catalogApi } from './catalog';

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
export interface ProductQuery { category?: string; tag?: string; q?: string; minPrice?: number; maxPrice?: number; minRating?: number; inStockOnly?: boolean; sort?: SortKey; }

export const api = {
  async getCategories() { return catalogApi.categories(); },
  async getProducts(query: ProductQuery = {}): Promise<Product[]> {
    const result = await catalogApi.products({ search: query.q, categorySlug: query.category, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: query.sort === 'price-asc' ? 'price_asc' : query.sort === 'price-desc' ? 'price_desc' : query.sort === 'newest' ? 'newest' : undefined, limit: 50 });
    return result.items.filter((item) => (!query.inStockOnly || item.stock > 0) && (!query.minRating || item.rating >= query.minRating));
  },
  async getProduct(id: string): Promise<Product> { return catalogApi.product(id); },
  async getRelated(product: Product, count = 8): Promise<Product[]> { const result = await catalogApi.products({ categorySlug: product.categorySlug, limit: count + 1 }); return result.items.filter((item) => item.id !== product.id).slice(0, count); },
};
