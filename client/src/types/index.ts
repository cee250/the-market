/**
 * Domain types shared across the storefront.
 * These mirror the shapes the backend API will return, so the UI
 * stays stable when the mock data layer is swapped for real endpoints.
 */

export type ProductTag = 'featured' | 'latest' | 'best-seller' | 'new';

export interface Category {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  price: number;
  /** Original (strikethrough) price when the product is on sale. */
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  description: string;
  specs: ProductSpec[];
  image: string;
  stock: number;
  tags: ProductTag[];
  /** ISO date used for "newest" sorting. */
  createdAt: string;
}

export interface CartItem {
  /** Product id. */
  id: string;
  qty: number;
}

export interface Promo {
  code: string;
  percent: number;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  role?: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  emailVerified?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  price: number;
  qty: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes?: string;
}

export type PaymentMethod = 'mtn-momo' | 'airtel-money' | 'card';

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  customer: CustomerInfo;
  paymentMethod: PaymentMethod;
  createdAt: string;
  status: 'confirmed';
}
