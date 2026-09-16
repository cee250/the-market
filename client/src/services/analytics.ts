const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface AnalyticsReport {
  scope: 'vendor' | 'platform';
  totalOrders: number;
  completedOrders: number;
  unitsSold: number;
  revenue: number;
  averageOrderValue: number;
  topProducts: { name: string; unitsSold: number; revenue: number }[];
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, { credentials: 'include' });
  if (!response.ok) throw new Error('Unable to load analytics');
  return response.json() as Promise<T>;
}

export const analyticsApi = {
  vendor: () => request<AnalyticsReport>('/analytics/vendor'),
  admin: () => request<AnalyticsReport>('/analytics/admin'),
};
