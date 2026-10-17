const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  vendorId: string;
  vendorName: string;
  variantId?: string;
  variantSku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  currency: string;
  selectedOptions: Record<string, unknown>;
}
export interface Cart { id: string; items: CartItem[]; subtotal: number }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body ? body.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(', ') : message || 'Unable to complete the order request');
  }
  return body as T;
}

export const ordersApi = {
  cart: () => request<Cart>('/cart'),
  add: (productId: string, quantity: number, variantId?: string, selectedOptions?: Record<string, unknown>) => request<Cart>('/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity, variantId, selectedOptions }) }),
  update: (itemId: string, quantity: number) => request<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  remove: (itemId: string) => request<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' }),
  checkout: (input: { customerName: string; phone: string; email: string; deliveryAddress: string; fulfillmentMethod: 'DELIVERY' | 'PICKUP'; paymentMethod: string }, idempotencyKey?: string) => request<Record<string, unknown>>('/checkout', { method: 'POST', headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined, body: JSON.stringify(input) }),
  orders: () => request<Record<string, unknown>[]>('/orders'),
  order: (id: string) => request<Record<string, unknown>>(`/orders/${encodeURIComponent(id)}`),
};
