import { demoCategories, demoProducts } from './demoData';

export interface Category { id: string; name: string; slug: string; isActive?: boolean; subcategories: { id: string; name: string; slug: string }[] }
export interface Product { id: string; name: string; slug: string; sku?: string; description?: string; price: number; currency: string; categoryId?: string; categoryName?: string; subcategoryId?: string; subcategoryName?: string; location: string; condition: string; availability: string; status: 'DRAFT' | 'PUBLISHED'; images: { id: string; url: string; sortOrder: number; isCover: boolean }[]; variants?: ProductVariant[] }
export interface ProductVariant { id: string; sku: string; color?: string; size?: string; storage?: string; model?: string; price?: number; stock: number; availability: string; isActive: boolean }

const CATEGORY_KEY = 'market.demo.posting.categories.v1';
const PRODUCT_KEY = 'market.demo.posting.products.v1';
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const defaultSubcategories: Record<string, string[]> = {
  'womens-fashion': ['Dresses', 'Bags & Accessories', 'Shoes'], 'mens-fashion': ['Shirts', 'Shoes', 'Accessories'], 'mobiles-computers': ['Phones', 'Computers', 'Accessories'], 'tv-electronics': ['Televisions', 'Audio', 'Smart Home'], 'home-kitchen': ['Kitchen', 'Decor', 'Furniture'], 'beauty-health': ['Skincare', 'Haircare', 'Wellness'], 'outdoor-travel': ['Travel Gear', 'Camping', 'Fitness'], 'gifts-stationery': ['Stationery', 'Gifts', 'Desk Accessories'],
};
function readCategories(): Category[] { try { const saved = JSON.parse(window.localStorage.getItem(CATEGORY_KEY) ?? 'null') as Category[] | null; if (saved) return saved; } catch { /* use defaults */ } return demoCategories.map((category) => ({ id: category.slug, name: category.name, slug: category.slug, isActive: true, subcategories: (defaultSubcategories[category.slug] ?? []).map((name) => ({ id: `${category.slug}-${slugify(name)}`, name, slug: slugify(name) })) })); }
function saveCategories(categories: Category[]) { try { window.localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories)); } catch { /* unavailable */ } }
function readProducts(): Product[] { try { return JSON.parse(window.localStorage.getItem(PRODUCT_KEY) ?? '[]') as Product[]; } catch { return []; } }
function saveProducts(products: Product[]) { try { window.localStorage.setItem(PRODUCT_KEY, JSON.stringify(products)); } catch { /* unavailable */ } }

export const productsApi = {
  async categories() { return readCategories(); },
  async toggleCategory(id: string, isActive: boolean) { const categories = readCategories().map((category) => category.id === id ? { ...category, isActive } : category); saveCategories(categories); return { id, isActive }; },
  async createSubcategory(categoryId: string, name: string) { const subcategory = { id: `${categoryId}-${Date.now()}`, name, slug: slugify(name), categoryId }; const categories = readCategories().map((category) => category.id === categoryId ? { ...category, subcategories: [...category.subcategories, subcategory] } : category); saveCategories(categories); return subcategory; },
  async mine() { return readProducts(); },
  async create(input: Record<string, unknown>) { const categories = readCategories(); const category = categories.find((item) => item.id === input.categoryId); const subcategory = category?.subcategories.find((item) => item.id === input.subcategoryId); const product: Product = { id: `demo-post-${Date.now()}`, name: String(input.name), slug: slugify(String(input.name)), sku: input.sku ? String(input.sku) : undefined, price: Number(input.price), currency: 'RWF', categoryId: category?.id, categoryName: category?.name, subcategoryId: subcategory?.id, subcategoryName: subcategory?.name, location: String(input.location ?? 'Kigali'), condition: 'NEW', availability: 'IN_STOCK', status: 'DRAFT', images: [], variants: [] }; const products = [product, ...readProducts()]; saveProducts(products); return product; },
  async update(id: string, input: Record<string, unknown>) { const products = readProducts().map((product) => product.id === id ? { ...product, ...input } : product); saveProducts(products); return products.find((product) => product.id === id)!; },
  async remove(id: string) { saveProducts(readProducts().filter((product) => product.id !== id)); return { deleted: true }; },
  async publish(id: string, status: 'DRAFT' | 'PUBLISHED') { const products = readProducts().map((product) => product.id === id ? { ...product, status } : product); saveProducts(products); return products.find((product) => product.id === id)!; },
  async addImages(id: string, urls: string[]) { const products = readProducts().map((product) => product.id === id ? { ...product, images: [...product.images, ...urls.map((url, index) => ({ id: `${id}-image-${Date.now()}-${index}`, url, sortOrder: product.images.length + index, isCover: product.images.length === 0 && index === 0 }))] } : product); saveProducts(products); return products.find((product) => product.id === id)!; },
  async reorderImages() { return readProducts()[0]; },
  async coverImage() { return readProducts()[0]; },
  async variants(id: string) { return readProducts().find((product) => product.id === id)?.variants ?? []; },
  async addVariant(id: string, input: Record<string, unknown>) { const products = readProducts().map((product) => product.id === id ? { ...product, variants: [...(product.variants ?? []), { id: `${id}-variant-${Date.now()}`, sku: String(input.sku ?? ''), color: input.color ? String(input.color) : undefined, size: input.size ? String(input.size) : undefined, stock: Number(input.stock ?? 0), availability: 'IN_STOCK', isActive: true }] } : product); saveProducts(products); return products.find((product) => product.id === id)?.variants?.at(-1)!; },
  async removeVariant() { return { deleted: true }; },
};
