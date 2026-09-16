import type { User } from '../types';

interface AuthResponse { user: User; verificationToken?: string }
interface DemoAccount { user: User; password: string }
const ACCOUNT_KEY = 'market.demo.accounts.v1';
const SESSION_KEY = 'market.demo.session.v1';
function accounts(): DemoAccount[] { try { return JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) ?? '[]') as DemoAccount[]; } catch { return []; } }
function saveAccounts(value: DemoAccount[]) { try { window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(value)); } catch { /* unavailable */ } }
function session(): User | null { try { return JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? 'null') as User | null; } catch { return null; } }
function saveSession(user: User | null) { try { if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user)); else window.localStorage.removeItem(SESSION_KEY); } catch { /* unavailable */ } }

export const authApi = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const existing = accounts(); if (existing.some((account) => account.user.email.toLowerCase() === email.toLowerCase())) throw new Error('An account with this email already exists.');
    const user: User = { id: `demo-user-${Date.now()}`, name, email, role: 'CUSTOMER', emailVerified: true }; saveAccounts([...existing, { user, password }]); saveSession(user); return { user };
  },
  async registerVendor(input: { name: string; businessName: string; email: string; phone: string; location: string; password: string; confirmPassword: string; termsVersion: string }): Promise<AuthResponse> {
    const result = await this.register(input.name, input.email, input.password); const user = { ...result.user, role: 'VENDOR' as const, vendorStatus: 'PENDING_APPROVAL' as const }; const next = accounts().map((account) => account.user.id === user.id ? { ...account, user } : account); saveAccounts(next); saveSession(user); return { user, verificationToken: 'demo-verification' };
  },
  async login(email: string, password: string): Promise<AuthResponse> {
    if (email.toLowerCase() === 'admin@market.demo' && password === 'admin123') { const user: User = { id: 'demo-admin', name: 'Market Admin', email, role: 'ADMIN', emailVerified: true }; saveSession(user); return { user }; }
    const account = accounts().find((entry) => entry.user.email.toLowerCase() === email.toLowerCase()); if (!account) throw new Error('No demo account found. Create an account first.'); if (account.password !== password) throw new Error('Incorrect password.'); saveSession(account.user); return { user: account.user };
  },
  async me(): Promise<AuthResponse> { const user = session(); if (!user) throw new Error('Not signed in'); return { user }; },
  async logout(): Promise<void> { saveSession(null); },
  async requestPasswordReset(_email: string) { return { message: 'Demo mode: password reset instructions are not sent, but your storefront is ready to explore.' }; },
};
