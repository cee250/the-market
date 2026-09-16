import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { getOrders, ordersApi } from '../services/orders';
import { formatPrice } from '../lib/utils';
import { useAsync } from '../hooks/useAsync';
import type { Order } from '../types';

interface ServerOrder { id: string; order_number?: string; created_at?: string; total: number; status?: string; order_items?: { id: string; product_name: string; quantity: number; unit_price: number }[]; }
const normalize = (order: ServerOrder): Order => ({ id: order.order_number ?? order.id, items: (order.order_items ?? []).map((item) => ({ id: item.id, name: item.product_name, image: 'https://placehold.co/80x80?text=Market', price: item.unit_price, qty: item.quantity })), subtotal: order.total, discount: 0, shipping: 0, total: order.total, customer: { name: '', phone: '', email: '', address: '', city: '' }, paymentMethod: 'mtn-momo', createdAt: order.created_at ?? new Date().toISOString(), status: 'confirmed' });
export function OrdersPage() {
  const request = useAsync(async () => { try { return (await ordersApi.orders() as ServerOrder[]).map(normalize); } catch { return getOrders(); } }, []);
  const orders = request.data ?? [];
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><h1 className="text-2xl font-bold text-slate-900">My Orders</h1>{request.loading ? <div className="mt-6 h-32 animate-pulse rounded-2xl bg-slate-100" /> : orders.length === 0 ? <EmptyState icon={PackageSearch} title="No orders yet" text="When you place an order, it will show up here with its status and tracking." action={{ label: 'Start shopping', to: '/shop' }} /> : <div className="mt-6 space-y-4">{orders.map((order) => <Link key={order.id} to={`/order-success/${order.id}`} className="block rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-emerald-200 hover:shadow-md"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{order.id}</p><p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · {order.items.reduce((s, i) => s + i.qty, 0)} items</p></div><div className="flex items-center gap-4"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{order.status}</span><span className="text-sm font-extrabold text-slate-900">{formatPrice(order.total)}</span></div></div></Link>)}</div>}</div>;
}
