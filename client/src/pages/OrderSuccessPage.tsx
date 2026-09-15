import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, CreditCard, MapPin, PackageX } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { getOrder } from '../services/orders';
import { formatPrice } from '../lib/utils';

export function OrderSuccessPage() {
  const { orderId } = useParams();
  const order = getOrder(orderId ?? '');

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={PackageX}
          title="Order not found"
          text="We couldn't find that order. It may have been placed in a different browser."
          action={{ label: 'Back to home', to: '/' }}
        />
      </div>
    );
  }

  const firstName = order.customer.name.split(' ')[0];
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 animate-pop">
          <Check size={30} strokeWidth={2.5} />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Order confirmed, {firstName}!
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Thank you for shopping with Market. A confirmation was sent to{' '}
          <strong className="text-slate-700">{order.customer.email}</strong>. We'll text you
          tracking details as soon as your order ships.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Order number</p>
            <p className="text-sm font-bold text-slate-900">{order.id}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Placed</p>
            <p className="text-sm font-semibold text-slate-700">{date}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Confirmed
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <img
                src={item.image}
                alt=""
                className="h-14 w-14 rounded-xl bg-slate-50 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-400">Qty {item.qty}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {formatPrice(item.price * item.qty)}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/40 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Shipping</span>
            <span className={order.shipping === 0 ? 'font-medium text-emerald-700' : 'font-medium'}>
              {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-base font-extrabold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-100 px-5 py-5 sm:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              <MapPin size={12} /> Delivering to
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-900">{order.customer.name}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {order.customer.address}, {order.customer.city}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">{order.customer.phone}</p>
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
              <CreditCard size={12} /> Paid via
            </h3>
            <p className="mt-2 text-sm font-semibold capitalize text-slate-900">
              {order.paymentMethod.replace(/-/g, ' ')}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">Payment reference: {order.id}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/shop"
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Continue shopping
          <ArrowRight size={16} />
        </Link>
        <Link
          to="/orders"
          className="rounded-lg border border-slate-300 px-8 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
