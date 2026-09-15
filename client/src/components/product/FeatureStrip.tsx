import { Gift, Headphones, Lock, Truck } from 'lucide-react';

const FEATURES = [
  {
    icon: Truck,
    title: 'Free Shipping',
    text: 'On qualifying orders across Rwanda',
  },
  {
    icon: Headphones,
    title: 'Support 24/7',
    text: 'We are here whenever you need us',
  },
  {
    icon: Gift,
    title: 'Gift Ready',
    text: 'Perfect picks for every occasion',
  },
  {
    icon: Lock,
    title: 'Secure Payment',
    text: 'Checkout protected end to end',
  },
];

/** Trust bar with the four value props from the reference storefront. */
export function FeatureStrip() {
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Icon size={20} strokeWidth={1.8} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
