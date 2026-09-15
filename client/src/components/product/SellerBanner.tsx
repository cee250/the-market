import { Store } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { SITE } from '../../config/site';

/** "Grow your business" CTA — mirrors the seller banner on the reference site. */
export function SellerBanner() {
  const { toast } = useToast();

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-emerald-900">
        <img
          src="/images/banners/seller.jpg"
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-900/20" />
        <div className="relative max-w-xl px-6 py-12 sm:px-12 sm:py-16">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            <Store size={14} /> Partners
          </p>
          <h3 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
            Grow your business on {SITE.name}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-emerald-100 sm:text-base">
            Join thousands of sellers and reach customers across the region. Listing is free,
            payouts are fast.
          </p>
          <button
            type="button"
            onClick={() => toast('Seller onboarding is coming soon — stay tuned!', 'info')}
            className="mt-6 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-900 shadow-lg transition hover:bg-emerald-50"
          >
            Register as Seller
          </button>
        </div>
      </div>
    </section>
  );
}
