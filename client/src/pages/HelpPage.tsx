import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react';
import { SITE } from '../config/site';
import { formatPrice } from '../lib/utils';

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: `Most Kigali orders arrive within 24–48 hours. Nationwide delivery takes 2–4 business days. You'll get a tracking link by SMS and email as soon as your order ships.`,
  },
  {
    q: 'What are the shipping fees?',
    a: `Orders over ${formatPrice(SITE.freeShippingThreshold)} ship completely free. Smaller orders pay a flat fee of ${formatPrice(SITE.shippingFee)} nationwide.`,
  },
  {
    q: 'Which payment methods do you accept?',
    a: 'MTN Mobile Money, Airtel Money and Visa/Mastercard. All payments are processed through encrypted, PCI-DSS compliant channels.',
  },
  {
    q: 'What is your return policy?',
    a: 'Unused items in original packaging can be returned within 7 days for a full refund — no questions asked. Refunds go back to your original payment method within 3–5 business days.',
  },
  {
    q: 'How do I track my order?',
    a: 'Open “My Orders” from your account menu. Every order shows its status and, once dispatched, a live tracking link. You can also reach us at any time on the phone or by email.',
  },
  {
    q: 'Can I become a seller on Market?',
    a: 'Yes. Start the live seller registration flow at /register/vendor. You can create your vendor profile and continue through the required package and payment steps from there.',
  },
];

export function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Help & FAQ</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-500">
        Quick answers about shipping, payments, returns and your account. Can't find what you
        need? We're one message away.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-slate-100 bg-white transition open:border-emerald-200 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown
                  size={17}
                  className="shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>

        <aside className="h-fit rounded-2xl bg-emerald-900 p-6 text-white">
          <h2 className="text-base font-bold">Talk to a human</h2>
          <p className="mt-1.5 text-sm text-emerald-100">
            Our support team is available 24/7.
          </p>
          <div className="mt-5 space-y-3.5 text-sm">
            <a href={`tel:${SITE.supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 text-emerald-50 transition hover:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <Phone size={16} />
              </span>
              {SITE.supportPhone}
            </a>
            <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-3 text-emerald-50 transition hover:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <Mail size={16} />
              </span>
              {SITE.supportEmail}
            </a>
            <p className="flex items-center gap-3 text-emerald-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                <MapPin size={16} />
              </span>
              {SITE.address}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
