import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ShoppingBag, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/utils';

function titleCaseName(emailOrName: string): string {
  const base = emailOrName.includes('@') ? emailOrName.split('@')[0] : emailOrName;
  return base
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

const inputClass = (error?: string) =>
  cx(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2',
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20',
  );

interface AuthShellProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function AuthShell({ title, subtitle, icon, children }: AuthShellProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="mx-auto w-full rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          {icon}
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <div className="mt-6">{children}</div>
        <p className="mt-5 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
          <strong className="font-semibold text-slate-600">Demo mode:</strong> the backend
          arrives next — any valid-looking credentials will sign you in locally.
        </p>
      </div>
    </div>
  );
}

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const name = titleCaseName(email);
    login({ name, email: email.trim() });
    toast(`Welcome back, ${name.split(' ')[0]}!`);
    navigate(redirect, { replace: true });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your orders, wishlist and faster checkout."
      icon={<LogIn size={22} />}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass(errors.email)}
          />
          {errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputClass(errors.password)}
          />
          {errors.password && (
            <span className="mt-1 block text-xs text-rose-600">{errors.password}</span>
          )}
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Sign in
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">
        New to Market?{' '}
        <Link
          to={`/register?redirect=${encodeURIComponent(redirect)}`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 6) next.password = 'Password must be at least 6 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    login({ name: name.trim(), email: email.trim() });
    toast(`Welcome to Market, ${name.trim().split(' ')[0]}!`);
    navigate(redirect, { replace: true });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for orders, wishlist and faster checkout."
      icon={<UserPlus size={22} />}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aline Uwase"
            autoComplete="name"
            className={inputClass(errors.name)}
          />
          {errors.name && <span className="mt-1 block text-xs text-rose-600">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass(errors.email)}
          />
          {errors.email && <span className="mt-1 block text-xs text-rose-600">{errors.email}</span>}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
              className={inputClass(errors.password)}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-rose-600">{errors.password}</span>
            )}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              className={inputClass(errors.confirm)}
            />
            {errors.confirm && (
              <span className="mt-1 block text-xs text-rose-600">{errors.confirm}</span>
            )}
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Create account
        </button>
      </form>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-sm text-slate-500">
        <ShoppingBag size={14} className="text-emerald-600" />
        Already have an account?{' '}
        <Link
          to={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="font-semibold text-emerald-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
