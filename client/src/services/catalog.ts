import type { Category, Product } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  subcategories?: { id: string; name: string; slug: string }[];
}

interface ApiProduct {
  id: string;
  name: string;
  slug?: string;
  sku?: string | null;
  description?: string | null;
  price: number | string;
  currency?: string;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  subcategoryId?: string | null;
  subcategoryName?: string | null;
  location?: string | null;
  condition?: string | null;
  availability?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  vendorName?: string | null;
  vendorSlug?: string | null;
  rating?: number | string;
  reviewCount?: number | string;
  images?: { id: string; url: string; sortOrder: number; isCover: boolean }[];
  variants?: { id: string; sku: string; price?: number | null; stock: number; availability: string; isActive: boolean; color?: string | null; size?: string | null; storage?: string | null; model?: string | null }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MarketplaceResponse {
  items: Product[];
  page: number;
  limit: number;
  total: number;
}

const categoryImages: Record<string, string> = {
  'womens-fashion': '/images/categories/womens-fashion.jpg',
  'mens-fashion': '/images/categories/mens-fashion.jpg',
  'mobiles-computers': '/images/categories/mobiles-computers.jpg',
  'tv-electronics': '/images/categories/tv-electronics.jpg',
  'home-kitchen': '/images/categories/home-kitchen.jpg',
  'beauty-health': '/images/categories/beauty-health.jpg',
  'outdoor-travel': '/images/categories/home-kitchen.jpg',
  'gifts-stationery': '/images/categories/mobiles-computers.jpg',
};

export function categoryImage(slug: string) {
  return categoryImages[slug] ?? '/images/categories/home-kitchen.jpg';
}

function apiPath(path: string) {
  return `${API_URL}/api${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(apiPath(path), {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body
      ? body.message
      : undefined;
    throw new Error(Array.isArray(message) ? message.join(', ') : message || 'Unable to load the marketplace');
  }
  return body as T;
}

export function mapCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    shortName: category.name,
    description: category.description ?? '',
    image: categoryImage(category.slug),
    subcategories: category.subcategories ?? [],
  };
}

export function mapProduct(product: ApiProduct): Product {
  const images = product.images ?? [];
  const variants = product.variants ?? [];
  const image = images.find((item) => item.isCover)?.url ?? images[0]?.url ?? categoryImage('home-kitchen');
  const stock = variants.length > 0
    ? variants.filter((variant) => variant.isActive).reduce((sum, variant) => sum + Number(variant.stock || 0), 0)
    : product.availability?.toUpperCase() === 'OUT_OF_STOCK' ? 0 : 1;
  return {
    id: product.id,
    slug: product.slug ?? product.id,
    name: product.name,
    categorySlug: product.categorySlug ?? '',
    categoryName: product.categoryName ?? 'Marketplace',
    price: Number(product.price),
    originalPrice: undefined,
    rating: Number(product.rating ?? 0),
    reviewCount: Number(product.reviewCount ?? 0),
    description: product.description ?? '',
    specs: [],
    image,
    stock,
    tags: [],
    createdAt: product.createdAt ?? new Date(0).toISOString(),
    sku: product.sku ?? undefined,
    vendorName: product.vendorName ?? undefined,
    vendorSlug: product.vendorSlug ?? undefined,
    images,
    variants,
  };
}

export const catalogApi = {
  categories: () => request<ApiCategory[]>('/categories').then((items) => items.map(mapCategory)),
  products: (query: Record<string, string | number | undefined> = {}) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value));
    return request<{ items: ApiProduct[]; page: number; limit: number; total: number }>(`/marketplace/products${params.size ? `?${params.toString()}` : ''}`).then((result) => ({ ...result, items: result.items.map(mapProduct) }));
  },
  product: (identifier: string) => request<ApiProduct>(`/marketplace/products/${encodeURIComponent(identifier)}`).then(mapProduct),
  reviews: (identifier: string) => request<{ id: string; reviewer_name: string; rating: number; comment: string; created_at: string }[]>(`/marketplace/products/${encodeURIComponent(identifier)}/reviews`),
  createReview: (productId: string, input: { rating: number; comment: string }) => request('/products/' + encodeURIComponent(productId) + '/reviews', { method: 'POST', body: JSON.stringify(input) }),
};
