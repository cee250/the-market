import type { User } from '../types';

interface AuthResponse { user: User; verificationToken?: string }
interface DemoAccount { user: User; password: string }
const ACCOUNT_KEY = 'market.demo.accounts.v1';
const SESSION_KEY = 'market.demo.session.v1';
function accounts(): DemoAccount[] { try { return JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) ?? '[]') as DemoAccount[]; } catch { return []; } }
function saveAccounts(value: DemoAccount[]) { try { window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(value)); } catch { /* unavailable */ } }
function session(): User | null { try { return JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? 'null') as User | null; } catch { return null; } }
function saveSession(user: User | null) { try { if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user)); else window.localStorage.removeItem(SESSION_KEY); } catch { /* unavailable */ } }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> { const response = await fetch(`/api${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(', ') : body.message || 'Request failed'); return body as T; }

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  },
  async registerVendor(input: { name: string; businessName: string; email: string; phone: string; location: string; password: string; confirmPassword: string; termsVersion: string; packageName: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register/vendor', { method: 'POST', body: JSON.stringify(input) });
  },
  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async me(): Promise<AuthResponse> { return request<AuthResponse>('/auth/me'); },
  async logout(): Promise<void> { await request<unknown>('/auth/logout', { method: 'POST' }); },
  async requestPasswordReset(email: string) {
    const response = await fetch('/api/auth/password-reset/request', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Unable to request a password reset');
    return body as { message: string };
  },
  async resetPassword(token: string, password: string) {
    const response = await fetch('/api/auth/password-reset/confirm', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Unable to reset your password');
    return body as { message: string };
  },
  async verifyEmail(token: string) {
    return request<{ message: string }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
  },
};
