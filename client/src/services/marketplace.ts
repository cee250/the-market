import { catalogApi } from './catalog';

export interface MarketplaceQuery { search?: string; categoryId?: string; vendorId?: string; location?: string; condition?: string; minPrice?: number; maxPrice?: number; sort?: 'price_asc' | 'price_desc' | 'newest'; page?: number; limit?: number }
export interface MarketplaceReview { id: string; reviewer_name: string; rating: number; comment: string; created_at: string; }
export async function searchMarketplace(query: MarketplaceQuery = {}) {
  return catalogApi.products({ search: query.search, categoryId: query.categoryId, vendorId: query.vendorId, location: query.location, condition: query.condition, minPrice: query.minPrice, maxPrice: query.maxPrice, sort: query.sort, page: query.page, limit: query.limit ?? 20 });
}
export async function getMarketplaceProduct(slug: string) { return catalogApi.product(slug); }
export async function getMarketplaceReviews(slug: string): Promise<MarketplaceReview[]> { return catalogApi.reviews(slug); }
export async function createProductReview(productId: string, input: { rating: number; comment: string }) { return catalogApi.createReview(productId, input); }
export async function suggestMarketplace(query: string, limit = 6) { const result = await searchMarketplace({ search: query, limit }); return result.items.map((product) => ({ id: product.id, slug: product.slug, name: product.name, price: product.price, categoryName: product.categoryName, image: product.image })); }
