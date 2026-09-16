import { demoProducts, findDemoProduct } from './demoData';

export interface MarketplaceQuery { search?: string; categoryId?: string; vendorId?: string; location?: string; condition?: string; minPrice?: number; maxPrice?: number; sort?: 'price_asc' | 'price_desc' | 'newest'; page?: number; limit?: number }
export interface MarketplaceReview { id: string; reviewer_name: string; rating: number; comment: string; created_at: string; }
const REVIEWS_KEY = 'market.demo.reviews.v1';
function storedReviews(): Record<string, MarketplaceReview[]> { try { return JSON.parse(window.localStorage.getItem(REVIEWS_KEY) ?? '{}') as Record<string, MarketplaceReview[]>; } catch { return {}; } }

export async function searchMarketplace(query: MarketplaceQuery = {}) {
  const needle = query.search?.trim().toLowerCase();
  let items = demoProducts.filter((product) => !needle || `${product.name} ${product.categoryName} ${product.description}`.toLowerCase().includes(needle));
  if (query.minPrice !== undefined) items = items.filter((product) => product.price >= query.minPrice!);
  if (query.maxPrice !== undefined) items = items.filter((product) => product.price <= query.maxPrice!);
  if (query.sort === 'price_asc') items = [...items].sort((a, b) => a.price - b.price);
  if (query.sort === 'price_desc') items = [...items].sort((a, b) => b.price - a.price);
  if (query.sort === 'newest') items = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const limit = query.limit ?? 50;
  return { items: items.slice(0, limit), page: 1, limit, total: items.length };
}
export async function getMarketplaceProduct(slug: string) { const product = findDemoProduct(slug); if (!product) throw new Error('Product not found'); return product; }
export async function getMarketplaceReviews(slug: string): Promise<MarketplaceReview[]> { const product = findDemoProduct(slug); const saved = storedReviews()[product?.id ?? slug] ?? []; return [...saved, { id: 'demo-review-1', reviewer_name: 'Aline M.', rating: product?.rating ?? 5, comment: 'Lovely quality and exactly as described. Delivery was smooth too.', created_at: new Date(Date.now() - 86400000 * 4).toISOString() }]; }
export async function createProductReview(productId: string, input: { rating: number; comment: string }) { const all = storedReviews(); const reviews = all[productId] ?? []; const review = { id: `review-${Date.now()}`, reviewer_name: 'You', rating: input.rating, comment: input.comment, created_at: new Date().toISOString() }; all[productId] = [review, ...reviews]; try { window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(all)); } catch { /* unavailable */ } return review; }
export async function suggestMarketplace(query: string, limit = 6) { const result = await searchMarketplace({ search: query, limit }); return result.items.map((product) => ({ id: product.id, slug: product.slug, name: product.name, price: product.price, categoryName: product.categoryName, image: product.image })); }
