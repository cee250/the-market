import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { PROMO_CODES, SITE } from '../config/site';
import { api } from '../services/api';
import { ordersApi, type Cart } from '../services/orders';
import type { CartItem, Product, Promo } from '../types';

export interface ResolvedCartItem {
  id: string;
  cartItemId?: string;
  qty: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  categoryName: string;
  stock: number;
}
interface CartTotals { subtotal: number; discount: number; shipping: number; total: number }
interface CartContextValue {
  items: ResolvedCartItem[];
  count: number;
  loading: boolean;
  totals: CartTotals;
  promo: Promo | null;
  addItem: (productId: string, qty?: number, product?: Product) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  applyPromo: (code: string) => { ok: boolean; message: string };
  clearPromo: () => void;
}
const CartContext = createContext<CartContextValue | null>(null);

function localItems(rawItems: CartItem[]): ResolvedCartItem[] {
  return rawItems.flatMap((item) => item.product ? [{ id: item.product.id, qty: item.qty, name: item.product.name, image: item.product.image, price: item.product.price, originalPrice: item.product.originalPrice, categoryName: item.product.categoryName, stock: item.product.stock }] : []);
}

async function hydrateServerCart(cart: Cart): Promise<ResolvedCartItem[]> {
  const products = await Promise.all(cart.items.map(async (item) => {
    try { return [item, await api.getProduct(item.productId)] as const; } catch { return [item, null] as const; }
  }));
  return products.flatMap(([item, product]) => product ? [{ id: product.id, cartItemId: item.id, qty: item.quantity, name: product.name, image: product.image, price: item.unitPrice, originalPrice: product.originalPrice, categoryName: product.categoryName, stock: product.stock }] : []);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rawItems, setRawItems] = useLocalStorage<CartItem[]>('market.cart.v1', []);
  const [promo, setPromo] = useLocalStorage<Promo | null>('market.promo.v1', null);
  const [serverItems, setServerItems] = useState<ResolvedCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const loadServerCart = useCallback(async () => {
    setLoading(true);
    try { setServerItems(await hydrateServerCart(await ordersApi.cart())); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (user) void loadServerCart();
    else setServerItems([]);
  }, [loadServerCart, user]);
  const items = user ? serverItems : localItems(rawItems);
  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
    const shipping = items.length === 0 || subtotal - discount >= SITE.freeShippingThreshold ? 0 : SITE.shippingFee;
    const total = Math.max(0, subtotal - discount + shipping);
    return {
      items, count, loading, totals: { subtotal, discount, shipping, total }, promo,
      addItem: (productId, qty = 1, product) => {
        if (!product || product.stock === 0) return;
        if (user) void ordersApi.add(productId, qty).then((cart) => hydrateServerCart(cart).then(setServerItems));
        else setRawItems((previous) => { const existing = previous.find((item) => item.id === productId); return existing ? previous.map((item) => item.id === productId ? { ...item, qty: Math.min(item.qty + qty, product.stock), product } : item) : [...previous, { id: productId, qty: Math.min(qty, product.stock), product }]; });
      },
      setQty: (productId, qty) => {
        const existing = items.find((item) => item.id === productId);
        if (user && existing?.cartItemId) {
          if (qty <= 0) void ordersApi.remove(existing.cartItemId).then((cart) => hydrateServerCart(cart).then(setServerItems));
          else void ordersApi.update(existing.cartItemId, qty).then((cart) => hydrateServerCart(cart).then(setServerItems));
        } else {
          const local = rawItems.find((item) => item.id === productId);
          const max = local?.product?.stock ?? 99;
          setRawItems((previous) => qty <= 0 ? previous.filter((item) => item.id !== productId) : previous.map((item) => item.id === productId ? { ...item, qty: Math.min(qty, max) } : item));
        }
      },
      removeItem: (productId) => {
        const existing = items.find((item) => item.id === productId);
        if (user && existing?.cartItemId) void ordersApi.remove(existing.cartItemId).then((cart) => hydrateServerCart(cart).then(setServerItems));
        else setRawItems((previous) => previous.filter((item) => item.id !== productId));
      },
      clear: () => {
        if (user) void Promise.all(items.flatMap((item) => item.cartItemId ? [ordersApi.remove(item.cartItemId).catch(() => undefined)] : [])).then(() => loadServerCart());
        else setRawItems([]);
        setPromo(null);
      },
      has: (productId) => items.some((item) => item.id === productId),
      applyPromo: (code) => { const normalized = code.trim().toUpperCase(); const percent = PROMO_CODES[normalized]; if (!percent) return { ok: false, message: 'That code is not valid.' }; setPromo({ code: normalized, percent }); return { ok: true, message: `Code ${normalized} applied — ${percent}% off.` }; },
      clearPromo: () => setPromo(null),
    };
  }, [items, loading, loadServerCart, promo, rawItems, setRawItems, setPromo, user]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const ctx = useContext(CartContext); if (!ctx) throw new Error('useCart must be used within CartProvider'); return ctx; }
