import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { getOrders } from '../services/orders';
import { formatPrice } from '../lib/utils';

export function OrdersPage() {
  const orders = getOrders();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>

      {orders.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No orders yet"
          text="When you place an order, it will show up here with its status and tracking."
          action={{ label: 'Start shopping', to: '/shop' }}
        />
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/order-success/${order.id}`}
              className="block rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item) => (
                      <img
                        key={item.id}
                        src={item.image}
                        alt=""
                        className="h-12 w-12 rounded-xl border-2 border-white bg-slate-50 object-cover"
                      />
                    ))}
                    {order.items.length > 3 && (
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-xs font-bold text-slate-600">
                        +{order.items.length - 3}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{order.id}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      · {order.items.reduce((s, i) => s + i.qty, 0)} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Confirmed
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
