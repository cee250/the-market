import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, LogIn, ShoppingBag, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/auth';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/utils';

const inputClass = (error?: string) => cx(
  'w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2',
  error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20',
);

interface AuthShellProps { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }
function AuthShell({ title, subtitle, icon, children }: AuthShellProps) {
  return <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6">
    <div className="mx-auto w-full rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">{icon}</span>
      <h1 className="mt-4 text-xl font-extrabold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
      <p className="mt-5 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">Your account is protected by a server-side password hash and secure session cookie.</p>
    </div>
  </div>;
}

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 8) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const user = await login(email.trim(), password);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally { setBusy(false); }
  };

  return <AuthShell title="Welcome back" subtitle="Sign in to see your orders, wishlist and faster checkout." icon={<LogIn size={22} />}>
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputClass(error)} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className={inputClass(error)} /></label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={busy} type="submit" className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <div className="mt-5 flex justify-between text-sm"><Link to="/password-reset" className="font-semibold text-emerald-700 hover:underline">Forgot password?</Link><Link to={`/register?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-emerald-700 hover:underline">Create an account</Link></div>
  </AuthShell>;
}

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 8 || confirm !== password) {
      setError('Enter valid details, use at least 8 password characters, and make the passwords match.'); return;
    }
    setBusy(true);
    try {
      const result = await register(name.trim(), email.trim(), password);
      toast(`Welcome to Market, ${result.user.name.split(' ')[0]}! Check your email to verify your account.`);
      navigate(redirect, { replace: true });
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create account'); }
    finally { setBusy(false); }
  };

  return <AuthShell title="Create your account" subtitle="One account for orders, wishlist and faster checkout." icon={<UserPlus size={22} />}>
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Aline Uwase" autoComplete="name" className={inputClass(error)} /></label>
      <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputClass(error)} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" autoComplete="new-password" className={inputClass(error)} /></label><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm</span><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" className={inputClass(error)} /></label></div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button disabled={busy} type="submit" className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-sm text-slate-500"><ShoppingBag size={14} className="text-emerald-600" />Already have an account? <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-emerald-700 hover:underline">Sign in</Link></p>
    <p className="mt-3 text-center text-sm text-slate-500">Want to sell on Market? <Link to="/register/vendor" className="font-semibold text-emerald-700 hover:underline">Register as a vendor</Link></p>
  </AuthShell>;
}

export function PasswordResetPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => { e.preventDefault(); setBusy(true); try { const result = await authApi.requestPasswordReset(email.trim()); setMessage(result.message); toast('If the account exists, reset instructions are on the way.'); } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to request a reset'); } finally { setBusy(false); } };
  return <AuthShell title="Reset your password" subtitle="Enter your email and we’ll send secure reset instructions." icon={<KeyRound size={22} />}>
    <form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={inputClass()} /></label><button disabled={busy} className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Sending…' : 'Send reset instructions'}</button></form>
    {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}<p className="mt-5 text-center text-sm"><Link to="/login" className="font-semibold text-emerald-700 hover:underline">Back to sign in</Link></p>
  </AuthShell>;
}
