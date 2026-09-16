import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { CITIES, SITE } from '../config/site';
import { useCart } from '../context/CartContext';
import { cx, formatPrice } from '../lib/utils';
import { ordersApi, saveOrder } from '../services/orders';
import type { Order, OrderItem, PaymentMethod } from '../types';

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Shipping' },
  { n: 2, label: 'Payment' },
  { n: 3, label: 'Review' },
];

const METHODS: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof Smartphone;
}[] = [
  { id: 'mtn-momo', label: 'MTN Mobile Money', desc: 'Pay with your MTN wallet', icon: Smartphone },
  { id: 'airtel-money', label: 'Airtel Money', desc: 'Pay with your Airtel wallet', icon: Wallet },
  { id: 'card', label: 'Visa / Mastercard', desc: 'Pay with a debit or credit card', icon: CreditCard },
];

const inputClass = (error?: string) =>
  cx(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2',
    error
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20',
  );

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [placing, setPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod>('mtn-momo');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });

  // Guard: nothing to check out with
  if (!placing && cart.items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = (s: Step): boolean => {
    const next: Record<string, string> = {};
    if (s === 1) {
      if (!form.name.trim()) next.name = 'Full name is required.';
      if (!/^[+\d][\d\s-]{7,}$/.test(form.phone.trim()))
        next.phone = 'Enter a valid phone number (e.g. 078 812 3456).';
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
      if (!form.address.trim()) next.address = 'Delivery address is required.';
      if (!form.city) next.city = 'Select your city.';
    }
    if (s === 2 && method === 'card') {
      if (card.number.replace(/\s/g, '').length < 12) next.cardNumber = 'Enter a valid card number.';
      if (!/^\d{2}\s*\/\s*\d{2}$/.test(card.expiry.trim())) next.cardExpiry = 'Use MM/YY.';
      if (!/^\d{3,4}$/.test(card.cvv.trim())) next.cardCvv = '3–4 digits.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (validate(step)) {
      setStep((s) => Math.min(3, s + 1) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    setStep((s) => Math.max(1, s - 1) as Step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeOrder = async () => {
    if (!validate(2) && !validate(1)) return;
    setPlacing(true);
    setCheckoutError('');
    try {
      const result = await ordersApi.checkout({ customerName: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), deliveryAddress: `${form.address.trim()}, ${form.city}`, fulfillmentMethod: 'DELIVERY', paymentMethod: method }, idempotencyKey) as { id?: string; order_number?: string };
      const orderId = result.id ?? result.order_number;
      if (!orderId) throw new Error('The order was created without an identifier.');
    const items: OrderItem[] = cart.items.map((i) => ({
      id: i.id,
      name: i.name,
      image: i.image,
      price: i.price,
      qty: i.qty,
    }));
    const order: Order = {
      id: `MK-${Date.now().toString(36).toUpperCase()}`,
      items,
      subtotal: cart.totals.subtotal,
      discount: cart.totals.discount,
      shipping: cart.totals.shipping,
      total: cart.totals.total,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city,
        notes: form.notes.trim() || undefined,
      },
      paymentMethod: method,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
      saveOrder({ ...order, id: String(orderId) });
      cart.clear();
      navigate(`/order-success/${orderId}`);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Checkout could not be completed.');
      setPlacing(false);
    }
  };

  const { subtotal, discount, shipping, total } = cart.totals;
  const methodLabel = METHODS.find((m) => m.id === method)?.label ?? method;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

      {/* Stepper */}
      <ol className="mt-6 flex items-center">
        {STEPS.map((s, i) => (
          <li key={s.n} className={cx('flex items-center', i < STEPS.length - 1 && 'flex-1')}>
            <button
              type="button"
              disabled={s.n >= step}
              onClick={() => s.n < step && setStep(s.n)}
              className={cx('flex items-center gap-2.5', s.n < step && 'cursor-pointer')}
            >
              <span
                className={cx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition',
                  s.n < step
                    ? 'bg-emerald-600 text-white'
                    : s.n === step
                      ? 'border-2 border-emerald-600 bg-white text-emerald-700'
                      : 'border border-slate-200 bg-white text-slate-400',
                )}
              >
                {s.n < step ? <Check size={15} /> : s.n}
              </span>
              <span
                className={cx(
                  'hidden text-sm font-semibold sm:block',
                  s.n <= step ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span
                className={cx(
                  'mx-3 h-px flex-1 sm:mx-4',
                  s.n < step ? 'bg-emerald-500' : 'bg-slate-200',
                )}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-7">
          {/* STEP 1 — Shipping */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <MapPin size={18} className="text-emerald-600" /> Shipping details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={errors.name}>
                  <input
                    className={inputClass(errors.name)}
                    value={form.name}
                    onChange={(e) => set('name')(e.target.value)}
                    placeholder="Aline Uwase"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone" error={errors.phone}>
                  <input
                    className={inputClass(errors.phone)}
                    value={form.phone}
                    onChange={(e) => set('phone')(e.target.value)}
                    placeholder="078 812 3456"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </Field>
              </div>
              <Field label="Email" error={errors.email}>
                <input
                  className={inputClass(errors.email)}
                  value={form.email}
                  onChange={(e) => set('email')(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                />
              </Field>
              <Field label="Delivery address" error={errors.address}>
                <input
                  className={inputClass(errors.address)}
                  value={form.address}
                  onChange={(e) => set('address')(e.target.value)}
                  placeholder="Street, building, landmark…"
                  autoComplete="street-address"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City / Sector" error={errors.city}>
                  <select
                    className={inputClass(errors.city)}
                    value={form.city}
                    onChange={(e) => set('city')(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Order notes (optional)">
                  <input
                    className={inputClass()}
                    value={form.notes}
                    onChange={(e) => set('notes')(e.target.value)}
                    placeholder="Delivery instructions"
                  />
                </Field>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Continue to payment
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Payment */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Lock size={17} className="text-emerald-600" /> Payment method
              </h2>
              <div className="space-y-3">
                {METHODS.map(({ id, label, desc, icon: Icon }) => (
                  <label
                    key={id}
                    className={cx(
                      'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition',
                      method === id
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/15'
                        : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={method === id}
                      onChange={() => setMethod(id)}
                      className="sr-only"
                    />
                    <span
                      className={cx(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        method === id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      <Icon size={19} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{label}</span>
                      <span className="block text-xs text-slate-500">{desc}</span>
                    </span>
                    <span
                      className={cx(
                        'flex h-5 w-5 items-center justify-center rounded-full border-2',
                        method === id ? 'border-emerald-600' : 'border-slate-300',
                      )}
                    >
                      {method === id && <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />}
                    </span>
                  </label>
                ))}
              </div>

              {method === 'card' ? (
                <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_110px_90px]">
                  <Field label="Card number" error={errors.cardNumber}>
                    <input
                      className={inputClass(errors.cardNumber)}
                      value={card.number}
                      onChange={(e) => {
                        setCard((c) => ({ ...c, number: e.target.value }));
                        setErrors((er) => ({ ...er, cardNumber: '' }));
                      }}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Expiry" error={errors.cardExpiry}>
                    <input
                      className={inputClass(errors.cardExpiry)}
                      value={card.expiry}
                      onChange={(e) => {
                        setCard((c) => ({ ...c, expiry: e.target.value }));
                        setErrors((er) => ({ ...er, cardExpiry: '' }));
                      }}
                      placeholder="MM/YY"
                    />
                  </Field>
                  <Field label="CVV" error={errors.cardCvv}>
                    <input
                      className={inputClass(errors.cardCvv)}
                      value={card.cvv}
                      onChange={(e) => {
                        setCard((c) => ({ ...c, cvv: e.target.value }));
                        setErrors((er) => ({ ...er, cardCvv: '' }));
                      }}
                      placeholder="123"
                      type="password"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  We'll send a payment prompt to{' '}
                  <strong className="text-slate-900">{form.phone || 'your phone number'}</strong> —
                  approve it from your phone to complete the purchase.
                </p>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Review order
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-900">Review your order</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Deliver to
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{form.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {form.address}, {form.city}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {form.phone} · {form.email}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Pay with
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{methodLabel}</p>
                  {method === 'card' ? (
                    <p className="mt-1 text-sm text-slate-600">
                      Card ending {card.number.replace(/\s/g, '').slice(-4) || '••••'}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-600">{form.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {cart.items.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 text-sm">
                    <img src={i.image} alt="" className="h-12 w-12 rounded-lg bg-slate-50 object-cover" />
                    <span className="min-w-0 flex-1 truncate text-slate-700">
                      {i.name} <span className="text-slate-400">× {i.qty}</span>
                    </span>
                    <span className="font-semibold text-slate-900">{formatPrice(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={placing}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {placing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> Place order · {formatPrice(total)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary (sticky) */}
        <aside className="rounded-2xl border border-slate-100 bg-white p-5 lg:sticky lg:top-36">
          <h2 className="text-base font-bold text-slate-900">Order Summary</h2>
          <div className="mt-4 max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {cart.items.map((i) => (
              <div key={i.id} className="flex items-center gap-3 text-sm">
                <img src={i.image} alt="" className="h-11 w-11 rounded-lg bg-slate-50 object-cover" />
                <span className="min-w-0 flex-1 truncate text-slate-700">
                  {i.name} <span className="text-slate-400">× {i.qty}</span>
                </span>
                <span className="font-medium text-slate-900">{formatPrice(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <dt>Promo {cart.promo?.code}</dt>
                <dd className="font-medium">−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd className={cx('font-medium', shipping === 0 && 'text-emerald-700')}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2.5 text-base font-extrabold text-slate-900">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <Link
            to="/cart"
            className="mt-4 block text-center text-sm font-medium text-slate-500 transition hover:text-emerald-700"
          >
            Back to cart
          </Link>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
            <Lock size={11} /> Payments are encrypted end to end
          </p>
        </aside>
      </div>
    </div>
  );
}
