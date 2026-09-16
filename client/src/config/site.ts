/**
 * Single source of truth for store-wide settings.
 * Tweak brand copy, pricing rules and support details here.
 */
export const SITE = {
  name: 'Market',
  url: import.meta.env.VITE_SITE_URL || 'https://market.rw',
  tagline: 'Everything you need, delivered.',
  currencySymbol: 'R₣',
  freeShippingThreshold: 25000,
  shippingFee: 1500,
  supportPhone: '+250 788 123 456',
  supportEmail: 'support@market.rw',
  address: 'KG 7 Avenue, Kigali, Rwanda',
} as const;

/** Promo codes available in the cart (percent discount). */
export const PROMO_CODES: Record<string, number> = {
  WELCOME10: 10,
  MARKET15: 15,
  TRAVEL20: 20,
};

export const PROMO_OFFERS = [
  { code: 'WELCOME10', percent: 10, title: 'Welcome offer', description: 'Save 10% on your first Market order.', accent: 'emerald' },
  { code: 'MARKET15', percent: 15, title: 'Market favourites', description: 'Take 15% off curated best sellers.', accent: 'amber' },
  { code: 'TRAVEL20', percent: 20, title: 'Weekend escape', description: 'Save 20% on Outdoor & Travel picks.', accent: 'sky' },
] as const;

/** Rwandan cities offered in the checkout form. */
export const CITIES = [
  'Kigali',
  'Huye',
  'Rubavu',
  'Musanze',
  'Muhanga',
  'Nyagatare',
  'Rulindo',
  'Gitarama',
  'Other',
] as const;
