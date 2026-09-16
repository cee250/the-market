import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bell,
  Heart,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  Store,
  User,
} from 'lucide-react';
import { SITE } from '../../config/site';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCompare } from '../../context/CompareContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { notificationsApi } from '../../services/notifications';
import { cx, formatPrice } from '../../lib/utils';
import { Drawer } from '../ui/Drawer';
import { SearchBar } from './SearchBar';

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      key={count}
      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white animate-pop"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'whitespace-nowrap text-sm transition hover:text-emerald-700',
    isActive ? 'font-semibold text-emerald-700' : 'text-slate-600',
  );

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const accountRef = useClickOutside<HTMLDivElement>(() => setAccountOpen(false));

  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const categories = useAsync(() => api.getCategories(), []);
  const categoryItems = categories.data ?? [];
  const notifications = useAsync(() => (user ? notificationsApi.list() : Promise.resolve({ items: [], unreadCount: 0 })), [user?.id]);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    setAccountOpen(false);
    toast('Signed out. See you soon!', 'info');
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-emerald-900 px-4 py-2 text-center text-[11px] font-medium text-emerald-50 sm:text-xs">
        Free shipping on orders over {formatPrice(SITE.freeShippingThreshold)} · 24/7 support ·
        Secure payment
      </div>

      {/* Main bar */}
      <div className="border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Market home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <ShoppingBag size={19} />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              {SITE.name}
            </span>
          </Link>

          <SearchBar className="hidden flex-1 md:block md:max-w-2xl" />

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              to="/register/vendor"
              className="hidden items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 sm:flex sm:text-sm"
            >
              <Store size={16} />
              <span>Register as Vendor</span>
            </Link>
            <Link
              to="/compare"
              className="relative hidden rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700 sm:block"
              aria-label={`Compare list (${compareCount} products)`}
              title="Compare"
            >
              <ArrowLeftRight size={20} />
              <Badge count={compareCount} />
            </Link>
            <Link
              to="/wishlist"
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-rose-500"
              aria-label={`Wishlist (${wishlistCount} products)`}
              title="Wishlist"
            >
              <Heart size={20} />
              <Badge count={wishlistCount} />
            </Link>
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700"
              aria-label={`Cart (${cartCount} items)`}
              title="Cart"
            >
              <ShoppingCart size={20} />
              <Badge count={cartCount} />
            </Link>
            {user && (
              <Link
                to="/notifications"
                className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700"
                aria-label={`Notifications (${notifications.data?.unreadCount ?? 0} unread)`}
                title="Notifications"
              >
                <Bell size={20} />
                <Badge count={notifications.data?.unreadCount ?? 0} />
              </Link>
            )}

            {/* Account */}
            <div ref={accountRef} className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setAccountOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 transition hover:ring-2 hover:ring-emerald-200"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-emerald-700"
                  aria-label="Sign in"
                >
                  <User size={20} />
                  <span className="hidden text-sm font-medium lg:inline">Sign in</span>
                </Link>
              )}

              {user && accountOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl animate-fade-in">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <nav className="p-1.5">
                    <Link
                      to="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Package size={16} className="text-slate-400" /> My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <Heart size={16} className="text-slate-400" /> Wishlist
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <LogOut size={16} className="text-slate-400" /> Sign out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="px-4 pb-3 md:hidden">
          <SearchBar onNavigate={closeMobile} />
        </div>

        {/* Category nav (desktop) */}
        <nav className="hidden border-t border-slate-100 lg:block" aria-label="Categories">
          <div className="mx-auto flex max-w-7xl items-center gap-7 px-6 py-2.5">
            <NavLink to="/shop" end className={navLinkClass}>
              All Products
            </NavLink>
            {categoryItems.map((c) => (
              <NavLink key={c.slug} to={`/category/${c.slug}`} className={navLinkClass}>
                {c.shortName}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Mobile menu */}
      <Drawer open={mobileOpen} onClose={closeMobile} title="Menu">
        <nav className="flex flex-col" aria-label="Mobile">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Shop
          </p>
          <Link
            to="/shop"
            onClick={closeMobile}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            All Products
          </Link>
          {categoryItems.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              onClick={closeMobile}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {c.shortName}
            </Link>
          ))}

          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Account
          </p>
          <Link
            to="/orders"
            onClick={closeMobile}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            My Orders
          </Link>
          <Link
            to="/wishlist"
            onClick={closeMobile}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Wishlist
          </Link>
          <Link
            to="/compare"
            onClick={closeMobile}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Compare
          </Link>
          <Link
            to="/help"
            onClick={closeMobile}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Help & FAQ
          </Link>
          <Link
            to="/register/vendor"
            onClick={closeMobile}
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600"
          >
            <Store size={16} /> Register as Vendor
          </Link>
          {user ? (
            <button
              type="button"
              onClick={() => {
                closeMobile();
                navigate('/');
                logout();
                toast('Signed out. See you soon!', 'info');
              }}
              className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut size={16} /> Sign out
            </button>
          ) : (
            <Link
              to="/login"
              onClick={closeMobile}
              className="mt-1 flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <User size={16} /> Sign in / Register
            </Link>
          )}
        </nav>
      </Drawer>

    </header>
  );
}
