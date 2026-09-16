import { Link } from 'react-router-dom';
import { ArrowLeftRight, ShoppingCart, X } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Price } from '../components/ui/Price';
import { RatingStars } from '../components/ui/RatingStars';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import type { Product } from '../types';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';

export function ComparePage() {
  const compare = useCompare();
  const cart = useCart();
  const { toast } = useToast();

  const productsRequest = useAsync(async () => (await Promise.all(compare.ids.map((id) => api.getProduct(id)))).filter((p): p is Product => Boolean(p)), [compare.ids.join('|')]);
  const products = productsRequest.data ?? [];

  // Union of spec labels, in first-seen order
  const specLabels: string[] = [];
  products.forEach((p) =>
    p.specs.forEach((s) => {
      if (!specLabels.includes(s.label)) specLabels.push(s.label);
    }),
  );

  const cols = {
    gridTemplateColumns: `minmax(110px, 150px) repeat(${Math.max(products.length, 1)}, minmax(230px, 1fr))`,
  };

  const row = (label: string, render: (p: Product) => React.ReactNode) => (
    <div key={label} className="grid border-b border-slate-100 last:border-0" style={cols}>
      <div className="flex items-center px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      {products.map((p) => (
        <div key={p.id} className="px-4 py-4">
          {render(p)}
        </div>
      ))}
    </div>
  );

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={ArrowLeftRight}
          title="Nothing to compare yet"
          text="Add up to 4 products using the compare icon on any product card."
          action={{ label: 'Browse products', to: '/shop' }}
        />
      </div>
    );
  }

  const handleAdd = (p: Product) => {
    if (p.stock === 0) return;
    cart.addItem(p.id, 1, p);
    toast(`${p.name} added to cart`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          Compare products{' '}
          <span className="text-base font-normal text-slate-500">({products.length}/4)</span>
        </h1>
        <button
          type="button"
          onClick={() => {
            compare.clear();
            toast('Compare list cleared', 'info');
          }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Clear all
        </button>
      </div>

      {products.length === 1 && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Add at least one more product to see a side-by-side comparison.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white">
        <div className="min-w-[560px]">
          {/* Header row */}
          <div className="grid border-b border-slate-100" style={cols}>
            <div />
            {products.map((p) => (
              <div key={p.id} className="relative px-4 pt-5">
                <button
                  type="button"
                  onClick={() => compare.remove(p.id)}
                  aria-label={`Remove ${p.name} from compare`}
                  className="absolute right-3 top-3 rounded-full bg-slate-100 p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <X size={13} />
                </button>
                <Link to={`/product/${p.id}`} className="block">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="mx-auto h-28 w-28 rounded-xl bg-slate-50 object-cover"
                  />
                  <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-emerald-700">
                    {p.name}
                  </p>
                </Link>
              </div>
            ))}
          </div>

          {row('Price', (p) => <Price value={p.price} original={p.originalPrice} size="sm" />)}
          {row('Rating', (p) => <RatingStars value={p.rating} count={p.reviewCount} size={13} />)}
          {row('Category', (p) => (
            <Link to={`/category/${p.categorySlug}`} className="text-sm text-emerald-700 hover:underline">
              {p.categoryName}
            </Link>
          ))}
          {row('Availability', (p) => (
            <span
              className={
                p.stock === 0
                  ? 'text-sm font-semibold text-rose-600'
                  : 'text-sm font-semibold text-emerald-700'
              }
            >
              {p.stock === 0 ? 'Out of stock' : 'In stock'}
            </span>
          ))}
          {specLabels.map((label) =>
            row(label, (p) => (
              <span className="text-sm text-slate-700">
                {p.specs.find((s) => s.label === label)?.value ?? '—'}
              </span>
            )),
          )}

          {/* Actions */}
          <div className="grid" style={cols}>
            <div className="px-4 py-5" />
            {products.map((p) => (
              <div key={p.id} className="px-4 py-5">
                <button
                  type="button"
                  onClick={() => handleAdd(p)}
                  disabled={p.stock === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <ShoppingCart size={15} />
                  {p.stock === 0 ? 'Unavailable' : 'Add to Cart'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
