import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, ShoppingBag } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { SITE } from '../../config/site';
import { useToast } from '../../context/ToastContext';

const PAYMENTS = ['MTN MoMo', 'Airtel Money', 'Visa', 'Mastercard'];

/* Brand marks are inline SVGs (lucide no longer ships brand icons) */
function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2.1 0-3.6 1.3-3.6 3.7V11H8.5v3h2.3v7h2.7Z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.8 4h2.7l-6 6.8L21.6 20h-5.5l-4.3-5.6L6.8 20H4.1l6.4-7.3L3.5 4h5.6l3.9 5.1L17.8 4Zm-1 14.4h1.5L8.7 5.5H7.1l9.7 12.9Z" />
    </svg>
  );
}

export function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast('Please enter a valid email address.', 'info');
      return;
    }
    toast('Subscribed! Watch your inbox for deals.');
    setEmail('');
  };

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <ShoppingBag size={19} />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">{SITE.name}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            {SITE.tagline} Shop fashion, electronics, home, beauty and more — with fast delivery
            and secure checkout.
          </p>
          <div className="mt-5 space-y-2 text-sm text-slate-400">
            <p className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0 text-emerald-400" /> {SITE.address}
            </p>
            <p className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-emerald-400" /> {SITE.supportPhone}
            </p>
            <p className="flex items-center gap-2.5">
              <Mail size={15} className="shrink-0 text-emerald-400" /> {SITE.supportEmail}
            </p>
          </div>
        </div>

        {/* Shop */}
        <nav aria-label="Shop">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/shop" className="transition hover:text-emerald-400">
                All Products
              </Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/category/${c.slug}`} className="transition hover:text-emerald-400">
                  {c.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Customer care */}
        <nav aria-label="Customer care">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Customer Care
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link to="/orders" className="transition hover:text-emerald-400">
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="transition hover:text-emerald-400">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/compare" className="transition hover:text-emerald-400">
                Compare Products
              </Link>
            </li>
            <li>
              <Link to="/help" className="transition hover:text-emerald-400">
                Help & FAQ
              </Link>
            </li>
            <li>
              <a href={`mailto:${SITE.supportEmail}`} className="transition hover:text-emerald-400">
                Contact Us
              </a>
            </li>
          </ul>
        </nav>

        {/* Newsletter */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
            Stay in the loop
          </h3>
          <p className="mt-4 text-sm text-slate-400">
            Get new arrivals and exclusive offers straight to your inbox.
          </p>
          <form onSubmit={subscribe} className="mt-4 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              Subscribe
            </button>
          </form>
          <div className="mt-6 flex gap-2">
            {[
              { icon: <FacebookIcon size={16} />, label: 'Facebook' },
              { icon: <InstagramIcon size={16} />, label: 'Instagram' },
              { icon: <XIcon size={15} />, label: 'X (Twitter)' },
            ].map(({ icon, label }) => (
              <a
                key={label}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition hover:bg-emerald-600 hover:text-white"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-md border border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
