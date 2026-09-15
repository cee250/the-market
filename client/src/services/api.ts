import { CATEGORIES } from '../data/categories';
import { PRODUCTS, productById } from '../data/products';
import type { Category, Product } from '../types';

/**
 * API layer — the ONLY place the UI talks to data.
 *
 * Today it is backed by local seed data with simulated network latency.
 * When the backend lands, re-implement these functions with `fetch`
 * (or an http client) pointing at VITE_API_URL — the rest of the app
 * does not change.
 */

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';

export interface ProductQuery {
  category?: string;
  tag?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  sort?: SortKey;
}

const LATENCY = 350;
const delay = (ms: number = LATENCY) => new Promise((resolve) => setTimeout(resolve, ms));

function applySort(items: Product[], sort: SortKey | undefined): Product[] {
  switch (sort) {
    case 'price-asc':
      return [...items].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...items].sort((a, b) => b.price - a.price);
    case 'rating':
      return [...items].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case 'newest':
      return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'featured':
    default:
      return items; // curated order from the data layer
  }
}

export const api = {
  async getCategories(): Promise<Category[]> {
    await delay(120);
    return CATEGORIES;
  },

  async getProducts(query: ProductQuery = {}): Promise<Product[]> {
    await delay();
    let items = [...PRODUCTS];

    if (query.category) items = items.filter((p) => p.categorySlug === query.category);
    if (query.tag) items = items.filter((p) => p.tags.includes(query.tag as Product['tags'][number]));
    if (query.minPrice != null) items = items.filter((p) => p.price >= query.minPrice!);
    if (query.maxPrice != null) items = items.filter((p) => p.price <= query.maxPrice!);
    if (query.minRating != null) items = items.filter((p) => p.rating >= query.minRating!);
    if (query.inStockOnly) items = items.filter((p) => p.stock > 0);

    if (query.q) {
      const q = query.q.trim().toLowerCase();
      if (q) {
        items = items.filter((p) =>
          [p.name, p.categoryName, p.description]
            .join(' ')
            .toLowerCase()
            .includes(q),
        );
      }
    }

    return applySort(items, query.sort);
  },

  async getProduct(id: string): Promise<Product | undefined> {
    await delay(220);
    return productById.get(id);
  },

  async getRelated(product: Product, count = 8): Promise<Product[]> {
    await delay(180);
    const sameCategory = PRODUCTS.filter(
      (p) => p.id !== product.id && p.categorySlug === product.categorySlug,
    );
    const others = PRODUCTS.filter(
      (p) => p.id !== product.id && p.categorySlug !== product.categorySlug,
    );
    return [...sameCategory, ...others].slice(0, count);
  },

  /** Live search suggestions for the header search box. */
  suggest(q: string, limit = 6): Product[] {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(query)).slice(0, limit);
  },
};
