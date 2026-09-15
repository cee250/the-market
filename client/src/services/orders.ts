import type { Order } from '../types';

/**
 * Local order persistence for the frontend phase.
 * The backend phase will replace this module with order endpoints —
 * the pages only depend on these three functions.
 */
const KEY = 'market.orders.v1';

export function getOrders(): Order[] {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '[]') as Order[];
  } catch {
    return [];
  }
}

export function getOrder(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}

export function saveOrder(order: Order): void {
  const all = getOrders();
  all.unshift(order);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage unavailable — order stays for the current navigation only
  }
}
