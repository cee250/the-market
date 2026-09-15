const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export interface AdminStats { users: number; vendors: number; publishedProducts: number; orders: number; paidMarketplaceRevenue: number; activeInventoryItems: number }
async function request<T>(path: string): Promise<T> { const response = await fetch(`${API_URL}/api${path}`, { credentials: 'include' }); if (!response.ok) throw new Error('Unable to load admin operations'); return response.json() as Promise<T>; }
export const adminApi = { stats: () => request<AdminStats>('/admin/stats'), audit: () => request<{ items: { id: string; action: string; entity: string; actor_name?: string; created_at: string }[] }>('/admin/audit-logs') };
