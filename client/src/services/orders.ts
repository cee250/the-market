import type { Order } from '../types';

export interface CartItem { id: string; productId: string; productName: string; productSlug: string; vendorId: string; vendorName: string; variantId?: string; variantSku?: string; quantity: number; unitPrice: number; subtotal: number; currency: string; selectedOptions: Record<string, unknown> }
export interface Cart { id: string; items: CartItem[]; subtotal: number }
const KEY = 'market.orders.v1';
export function getOrders(): Order[] { try { return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as Order[]; } catch { return []; } }
export function getOrder(id: string): Order | undefined { return getOrders().find((o) => o.id === id); }
export function saveOrder(order: Order): void { const all = getOrders(); all.unshift(order); try { window.localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* unavailable */ } }

export const ordersApi = {
  async cart(): Promise<Cart> { return { id: 'demo-cart', items: [], subtotal: 0 }; },
  async add(): Promise<Cart> { return { id: 'demo-cart', items: [], subtotal: 0 }; },
  async update(): Promise<Cart> { return { id: 'demo-cart', items: [], subtotal: 0 }; },
  async remove(): Promise<Cart> { return { id: 'demo-cart', items: [], subtotal: 0 }; },
  async checkout(_input: { customerName: string; phone: string; email: string; deliveryAddress: string; fulfillmentMethod: 'DELIVERY' | 'PICKUP'; paymentMethod: string }, _idempotencyKey?: string) { return { id: `MK-${Date.now().toString(36).toUpperCase()}` }; },
  async orders(): Promise<Order[]> { return getOrders(); },
  async order(id: string): Promise<Order> { const order = getOrder(id); if (!order) throw new Error('Order not found'); return order; },
};
