const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface PackageRecord { id: string; name: string; description: string | null; price: number; currency: string; productLimit: number; durationDays: number; isActive: boolean; createdAt: string; updatedAt: string }
export interface Entitlement { id: string; packageId: string; packageName: string; description: string | null; productLimit: number; durationDays: number; amount: number; currency: string; status: 'ACTIVE' | 'INACTIVE'; grantedAt?: string; revokedAt?: string }

async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } }); if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string | string[] } | null; const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message; throw new Error(message || 'The request could not be completed'); } return response.json() as Promise<T>; }

export const packagesApi = { list: () => request<PackageRecord[]>('/packages/admin'), create: (input: Omit<PackageRecord, 'id' | 'createdAt' | 'updatedAt'>) => request<PackageRecord>('/packages/admin', { method: 'POST', body: JSON.stringify(input) }), update: (id: string, input: Partial<PackageRecord>) => request<PackageRecord>(`/packages/admin/${id}`, { method: 'PATCH', body: JSON.stringify(input) }), entitlement: () => request<Entitlement | null>('/packages/vendor/entitlement') };
