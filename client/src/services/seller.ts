import { demoProducts } from './demoData';
import { productsApi, type Product } from './products';

export type SellerOrderStatus = 'PENDING' | 'PROCESSING' | 'READY_FOR_DELIVERY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export interface SellerOrderItem { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }
export interface SellerOrder { id: string; customerName: string; customerLocation: string; createdAt: string; status: SellerOrderStatus; items: SellerOrderItem[]; total: number }
export interface SellerAnalytics { totalOrders: number; completedOrders: number; unitsSold: number; revenue: number; averageOrderValue: number; pendingOrders: number; topProducts: { name: string; unitsSold: number; revenue: number }[]; recentRevenue: { label: string; value: number }[] }
const ORDER_KEY = 'market.demo.seller.orders.v1';
const statusCycle: SellerOrderStatus[] = ['PENDING', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const money = (value: number) => Math.round(value);
function seedOrders(): SellerOrder[] {
  const items = (productIndex: number, quantity: number): SellerOrderItem => { const product = demoProducts[productIndex % demoProducts.length]; return { productId: product.id, productName: product.name, quantity, unitPrice: product.price, subtotal: product.price * quantity }; };
  return [
    { id: 'ORD-1048', customerName: 'Clarisse N.', customerLocation: 'Kigali', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), status: 'PROCESSING', items: [items(0, 1), items(10, 1)], total: items(0, 1).subtotal + items(10, 1).subtotal },
    { id: 'ORD-1047', customerName: 'Eric M.', customerLocation: 'Musanze', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'DELIVERED', items: [items(4, 1)], total: items(4, 1).subtotal },
    { id: 'ORD-1046', customerName: 'Aurore K.', customerLocation: 'Kigali', createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'READY_FOR_DELIVERY', items: [items(3, 1), items(7, 1)], total: items(3, 1).subtotal + items(7, 1).subtotal },
    { id: 'ORD-1045', customerName: 'Patrick R.', customerLocation: 'Huye', createdAt: new Date(Date.now() - 86400000 * 6).toISOString(), status: 'DELIVERED', items: [items(8, 2)], total: items(8, 2).subtotal },
    { id: 'ORD-1044', customerName: 'Mireille U.', customerLocation: 'Kigali', createdAt: new Date(Date.now() - 86400000 * 8).toISOString(), status: 'OUT_FOR_DELIVERY', items: [items(10, 1)], total: items(10, 1).subtotal },
  ];
}
function readOrders(): SellerOrder[] { try { const saved = JSON.parse(window.localStorage.getItem(ORDER_KEY) ?? 'null') as SellerOrder[] | null; if (saved) return saved; } catch { /* seed below */ } const seeded = seedOrders(); try { window.localStorage.setItem(ORDER_KEY, JSON.stringify(seeded)); } catch { /* unavailable */ } return seeded; }
function saveOrders(orders: SellerOrder[]) { try { window.localStorage.setItem(ORDER_KEY, JSON.stringify(orders)); } catch { /* unavailable */ } }
export async function getSellerProducts(): Promise<Product[]> { return productsApi.mine(); }
export async function getSellerOrders(): Promise<SellerOrder[]> { return readOrders(); }
export async function updateSellerOrderStatus(id: string, status: SellerOrderStatus): Promise<SellerOrder[]> { const orders = readOrders().map((order) => order.id === id ? { ...order, status } : order); saveOrders(orders); return orders; }
export function getSellerStatusLabel(status: SellerOrderStatus) { return status.replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase()); }
export async function getSellerAnalytics(): Promise<SellerAnalytics> {
  const orders = readOrders(); const completedOrders = orders.filter((order) => order.status === 'DELIVERED'); const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0); const productMap = new Map<string, { name: string; unitsSold: number; revenue: number }>();
  for (const order of orders.filter((item) => item.status !== 'CANCELLED')) for (const item of order.items) { const current = productMap.get(item.productId) ?? { name: item.productName, unitsSold: 0, revenue: 0 }; current.unitsSold += item.quantity; current.revenue += item.subtotal; productMap.set(item.productId, current); }
  const recentRevenue = Array.from({ length: 7 }, (_, index) => { const date = new Date(Date.now() - (6 - index) * 86400000); const day = date.toISOString().slice(0, 10); return { label: date.toLocaleDateString('en-GB', { weekday: 'short' }), value: completedOrders.filter((order) => order.createdAt.slice(0, 10) === day).reduce((sum, order) => sum + order.total, 0) || (index === 6 ? revenue * 0.18 : index === 5 ? revenue * 0.24 : index === 3 ? revenue * 0.2 : revenue * 0.1) }; });
  const unitsSold = orders.filter((order) => order.status !== 'CANCELLED').reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  return { totalOrders: orders.length, completedOrders: completedOrders.length, unitsSold, revenue, averageOrderValue: completedOrders.length ? revenue / completedOrders.length : 0, pendingOrders: orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status)).length, topProducts: [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5), recentRevenue };
}
