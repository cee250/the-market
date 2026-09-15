const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface Subscription { id: string; packageId: string; packageName: string; productLimit: number; durationDays: number; amount: number; currency: string; startDate: string; endDate: string; status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED'; remainingSeconds: number; remainingDays: number }
export interface Renewal { id: string; packageId: string; paymentId?: string; amount: number; currency: string; startDate: string; endDate: string; approvedAt: string; approvedBy?: string }

async function request<T>(path: string): Promise<T> { const response = await fetch(`${API_URL}/api${path}`, { credentials: 'include' }); if (!response.ok) { const body = await response.json().catch(() => null) as { message?: string } | null; throw new Error(body?.message || 'The request could not be completed'); } return response.json() as Promise<T>; }
export const subscriptionsApi = { vendor: () => request<{ subscription: Subscription | null; renewals: Renewal[] }>('/subscriptions/vendor'), admin: () => request<Subscription[]>('/subscriptions/admin') };
