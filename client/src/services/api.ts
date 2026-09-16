import type { Category, Product } from '../types';
import { demoCategories, demoProducts, findDemoProduct } from './demoData';
import { searchMarketplace } from './marketplace';

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
export interface ProductQuery { category?: string; tag?: string; q?: string; minPrice?: number; maxPrice?: number; minRating?: number; inStockOnly?: boolean; sort?: SortKey; }

export const api = {
  async getCategories(): Promise<Category[]> { return demoCategories; },
  async getProducts(query: ProductQuery = {}): Promise<Product[]> {
    const result = await searchMarketplace({ search: query.q, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: query.sort === 'price-asc' ? 'price_asc' : query.sort === 'price-desc' ? 'price_desc' : query.sort === 'newest' ? 'newest' : undefined, limit: 50 });
    let items = result.items;
    if (query.tag) items = items.filter((item) => item.tags.includes(query.tag as Product['tags'][number]));
    const category = query.category;
    if (category) items = items.filter((item) => item.categorySlug === category || item.categoryName.toLowerCase() === category.toLowerCase());
    if (query.inStockOnly) items = items.filter((item) => item.stock > 0);
    if (query.minRating) items = items.filter((item) => item.rating >= query.minRating!);
    return items;
  },
  async getProduct(id: string): Promise<Product> { const product = findDemoProduct(id); if (!product) throw new Error('Product not found'); return product; },
  async getRelated(product: Product, count = 8): Promise<Product[]> { return demoProducts.filter((item) => item.id !== product.id && item.categorySlug === product.categorySlug).slice(0, count); },
};
