import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { productById } from '../data/products';
import { PROMO_CODES, SITE } from '../config/site';
import type { CartItem, Promo } from '../types';

export interface ResolvedCartItem {
  id: string;
  qty: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  categoryName: string;
  stock: number;
}

interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface CartContextValue {
  items: ResolvedCartItem[];
  count: number;
  totals: CartTotals;
  promo: Promo | null;
  addItem: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  has: (productId: string) => boolean;
  applyPromo: (code: string) => { ok: boolean; message: string };
  clearPromo: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [rawItems, setRawItems] = useLocalStorage<CartItem[]>('market.cart.v1', []);
  const [promo, setPromo] = useLocalStorage<Promo | null>('market.promo.v1', null);

  const value = useMemo<CartContextValue>(() => {
    const items: ResolvedCartItem[] = [];
    for (const item of rawItems) {
      const product = productById.get(item.id);
      if (!product) continue;
      items.push({
        id: product.id,
        qty: item.qty,
        name: product.name,
        image: product.image,
        price: product.price,
        originalPrice: product.originalPrice,
        categoryName: product.categoryName,
        stock: product.stock,
      });
    }

    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
    const shipping =
      items.length === 0 || subtotal - discount >= SITE.freeShippingThreshold ? 0 : SITE.shippingFee;
    const total = Math.max(0, subtotal - discount + shipping);

    return {
      items,
      count,
      totals: { subtotal, discount, shipping, total },
      promo,
      addItem: (productId, qty = 1) => {
        const product = productById.get(productId);
        if (!product || product.stock === 0) return;
        setRawItems((prev) => {
          const existing = prev.find((i) => i.id === productId);
          if (existing) {
            return prev.map((i) =>
              i.id === productId ? { ...i, qty: Math.min(i.qty + qty, product.stock) } : i,
            );
          }
          return [...prev, { id: productId, qty: Math.min(qty, product.stock) }];
        });
      },
      setQty: (productId, qty) => {
        const product = productById.get(productId);
        const max = product ? product.stock : 99;
        setRawItems((prev) =>
          qty <= 0
            ? prev.filter((i) => i.id !== productId)
            : prev.map((i) => (i.id === productId ? { ...i, qty: Math.min(qty, max) } : i)),
        );
      },
      removeItem: (productId) => setRawItems((prev) => prev.filter((i) => i.id !== productId)),
      clear: () => {
        setRawItems([]);
        setPromo(null);
      },
      has: (productId) => rawItems.some((i) => i.id === productId),
      applyPromo: (code) => {
        const normalized = code.trim().toUpperCase();
        const percent = PROMO_CODES[normalized];
        if (!percent) {
          return { ok: false, message: 'That code is not valid.' };
        }
        setPromo({ code: normalized, percent });
        return { ok: true, message: `Code ${normalized} applied — ${percent}% off.` };
      },
      clearPromo: () => setPromo(null),
    };
  }, [rawItems, promo, setRawItems, setPromo]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
