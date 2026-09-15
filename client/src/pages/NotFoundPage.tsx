import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <Compass size={30} strokeWidth={1.5} />
      </span>
      <p className="mt-6 text-6xl font-extrabold tracking-tight text-slate-900">404</p>
      <h1 className="mt-3 text-xl font-bold text-slate-900">This page took a holiday</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or has moved. Let's get you back to the good
        stuff.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Home size={16} /> Back to home
        </Link>
        <Link
          to="/shop"
          className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Shop products
        </Link>
      </div>
    </div>
  );
}
