import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authApi } from '../services/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<{ user: User; verificationToken?: string }>;
  registerVendor: (input: { name: string; businessName: string; email: string; phone: string; location: string; password: string; confirmPassword: string; termsVersion: string }) => Promise<{ user: User; verificationToken?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authVersion = useRef(0);

  useEffect(() => {
    const versionAtStart = authVersion.current;
    authApi.me().then((result) => { if (authVersion.current === versionAtStart) setUser(result.user); }).catch(() => { if (authVersion.current === versionAtStart) setUser(null); }).finally(() => { if (authVersion.current === versionAtStart) setLoading(false); });
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email, password) => {
      const result = await authApi.login(email, password);
      authVersion.current += 1;
      setUser(result.user);
      setLoading(false);
      return result.user;
    },
    register: async (name, email, password) => {
      const result = await authApi.register(name, email, password);
      authVersion.current += 1;
      setUser(result.user);
      setLoading(false);
      return result;
    },
    registerVendor: async (input) => {
      const result = await authApi.registerVendor(input);
      authVersion.current += 1;
      setUser(result.user);
      setLoading(false);
      return result;
    },
    logout: async () => {
      await authApi.logout().catch(() => undefined);
      authVersion.current += 1;
      setUser(null);
      setLoading(false);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
