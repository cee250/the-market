const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export interface NotificationItem { id: string; type: string; title: string; message: string; metadata?: Record<string, unknown>; read_at?: string | null; created_at: string; }
export interface NotificationResponse { items: NotificationItem[]; unreadCount: number; }
async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } }); if (!response.ok) throw new Error('Unable to load notifications'); return response.json() as Promise<T>; }
export const notificationsApi = { list: () => request<NotificationResponse>('/notifications'), markRead: (id: string) => request<NotificationItem>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }) };
