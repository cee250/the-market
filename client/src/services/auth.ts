import type { User } from '../types';

interface AuthResponse { user: User; verificationToken?: string }
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) { const message = body && typeof body === 'object' && 'message' in body ? body.message : undefined; throw new Error(Array.isArray(message) ? message.join(', ') : message || 'Request failed'); }
  return body as T;
}

export const authApi = {
  register: (name: string, email: string, password: string) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  registerVendor: (input: { name: string; businessName: string; email: string; phone: string; location: string; password: string; confirmPassword: string; termsVersion: string; packageName: string }) => request<AuthResponse>('/auth/register/vendor', { method: 'POST', body: JSON.stringify(input) }),
  login: (email: string, password: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<AuthResponse>('/auth/me'),
  logout: () => request<unknown>('/auth/logout', { method: 'POST' }).then(() => undefined),
  requestPasswordReset: (email: string) => request<{ message: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<{ message: string }>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }) }),
  verifyEmail: (token: string) => request<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
};
