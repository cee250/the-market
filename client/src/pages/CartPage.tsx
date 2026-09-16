import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Trash2, Truck, X } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { PROMO_OFFERS, SITE } from '../config/site';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { cx, formatPrice } from '../lib/utils';

export function CartPage() {
  const cart = useCart();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <EmptyState
          icon={Tag}
          title="Your cart is empty"
          text="Looks like you haven't added anything yet. Explore the collection and find something you love."
          action={{ label: 'Start shopping', to: '/shop' }}
        />
      </div>
    );
  }

  const { subtotal, discount, shipping, total } = cart.totals;
  const progress = Math.min(100, ((subtotal - discount) / SITE.freeShippingThreshold) * 100);
  const remaining = Math.max(0, SITE.freeShippingThreshold - (subtotal - discount));

  const handleApplyPromo = () => {
    if (!code.trim()) return;
    const result = cart.applyPromo(code);
    if (result.ok) {
      toast(result.message);
      setCode('');
      setCodeError('');
    } else {
      setCodeError(result.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Your Cart{' '}
        <span className="text-base font-normal text-slate-500">
          ({cart.count} item{cart.count === 1 ? '' : 's'})
        </span>
      </h1>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* Items */}
        <div className="space-y-4">
          {/* Free shipping progress */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="flex items-center gap-2 text-sm text-slate-700">
              <Truck size={16} className={shipping === 0 ? 'text-emerald-600' : 'text-slate-400'} />
              {shipping === 0 ? (
                <span>
                  You've unlocked <strong className="text-emerald-700">free shipping</strong> 🎉
                </span>
              ) : (
                <span>
                  Add <strong>{formatPrice(remaining)}</strong> more to get{' '}
                  <strong className="text-emerald-700">free shipping</strong>
                </span>
              )}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-4"
            >
              <Link
                to={`/product/${item.id}`}
                className="block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-28 sm:w-28"
              >
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {item.categoryName}
                    </p>
                    <Link
                      to={`/product/${item.id}`}
                      className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900 hover:text-emerald-700"
                    >
                      {item.name}
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      cart.removeItem(item.id);
                      toast('Removed from cart', 'info');
                    }}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <QuantityStepper
                    size="sm"
                    value={item.qty}
                    onChange={(v) => cart.setQty(item.id, v)}
                    max={item.stock}
                  />
                  <div className="text-right">
                    {item.originalPrice && (
                      <p className="text-xs text-slate-400 line-through">
                        {formatPrice(item.originalPrice * item.qty)}
                      </p>
                    )}
                    <p className="text-sm font-bold text-slate-900">
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <Link to="/shop" className="text-sm font-semibold text-emerald-700 hover:underline">
              ← Continue shopping
            </Link>
            <button
              type="button"
              onClick={() => {
                cart.clear();
                toast('Cart cleared', 'info');
              }}
              className="text-sm font-medium text-slate-500 transition hover:text-rose-600"
            >
              Clear cart
            </button>
          </div>
        </div>

        {/* Summary */}
        <aside className="sticky top-36 rounded-2xl border border-slate-100 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">Order Summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt className="flex items-center gap-1.5">
                  Promo {cart.promo?.code}
                  <button
                    type="button"
                    onClick={cart.clearPromo}
                    aria-label="Remove promo code"
                    className="rounded p-0.5 hover:bg-emerald-50"
                  >
                    <X size={12} />
                  </button>
                </dt>
                <dd className="font-medium">−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className={cx('font-medium', shipping === 0 ? 'text-emerald-700' : 'text-slate-900')}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
              <dt className="font-bold text-slate-900">Total</dt>
              <dd className="font-extrabold text-slate-900">{formatPrice(total)}</dd>
            </div>
          </dl>

          {/* Promo code */}
          {!cart.promo && (
            <div className="mt-4">
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setCodeError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  placeholder="Promo code"
                  aria-label="Promo code"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase placeholder:normal-case focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Apply
                </button>
              </div>
              {codeError ? (
                <p className="mt-1.5 text-xs text-rose-600">{codeError}</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMO_OFFERS.map((offer) => <button key={offer.code} type="button" onClick={() => setCode(offer.code)} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100">{offer.code} · {offer.percent}%</button>)}
                </div>
              )}
            </div>
          )}

          <Link
            to="/checkout"
            className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Proceed to Checkout
            <ArrowRight size={16} />
          </Link>
          <p className="mt-3 text-center text-xs text-slate-400">
            VAT included · Secure encrypted checkout
          </p>
        </aside>
      </div>
    </div>
  );
}
