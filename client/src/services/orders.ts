import type { Order } from '../types';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export interface CartItem { id: string; productId: string; productName: string; productSlug: string; vendorId: string; vendorName: string; variantId?: string; variantSku?: string; quantity: number; unitPrice: number; subtotal: number; currency: string; selectedOptions: Record<string, unknown> }
export interface Cart { id: string; items: CartItem[]; subtotal: number }
async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } }); if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string | string[] } | null; const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message; throw new Error(message || 'The request could not be completed'); } return response.json() as Promise<T>; }
export const ordersApi = { cart: () => request<Cart>('/cart'), add: (productId: string, quantity: number, variantId?: string, selectedOptions?: Record<string, unknown>) => request<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity, variantId, selectedOptions }) }), update: (id: string, quantity: number) => request<Cart>(`/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }), remove: (id: string) => request<Cart>(`/cart/items/${id}`, { method: 'DELETE' }), checkout: (input: { customerName: string; phone: string; email: string; deliveryAddress: string; fulfillmentMethod: 'DELIVERY' | 'PICKUP'; paymentMethod: string }, idempotencyKey = crypto.randomUUID()) => request<unknown>('/checkout', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) }), orders: () => request<unknown[]>('/orders') };

const KEY = 'market.orders.v1';
export function getOrders(): Order[] { try { return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as Order[]; } catch { return []; } }
export function getOrder(id: string): Order | undefined { return getOrders().find((o) => o.id === id); }
export function saveOrder(order: Order): void { const all = getOrders(); all.unshift(order); try { window.localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* unavailable */ } }
