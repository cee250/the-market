/**
 * Single source of truth for store-wide settings.
 * Tweak brand copy, pricing rules and support details here.
 */
export const SITE = {
  name: 'Market',
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
};

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
