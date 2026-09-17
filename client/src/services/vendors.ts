const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface ManagedVendor { id: string; userId: string; name: string; email: string; businessName: string; slug: string; phone: string; location: string; status: string; emailVerified: boolean; createdAt: string; updatedAt: string; totalProducts: number; publishedProducts: number; income: number; latestPayment: { amount: number; currency: string; status: string } | null }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string | string[] } | null; const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message; throw new Error(message || 'The request could not be completed'); }
  return response.json() as Promise<T>;
}

export const vendorsApi = {
  list: () => request<ManagedVendor[]>('/vendors/admin'),
  action: (id: string, action: 'ACTIVATE' | 'SUSPEND' | 'DEACTIVATE' | 'REACTIVATE', note?: string) => request<ManagedVendor>(`/vendors/admin/${id}/action`, { method: 'POST', body: JSON.stringify({ action, note }) }),
  remove: (id: string) => request<{ deleted: boolean; id: string }>(`/vendors/admin/${id}`, { method: 'DELETE' }),
};
