import { SITE } from '../config/site';

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Format a number as the store currency, e.g. R₣1,250,000. */
export function formatPrice(value: number): string {
  return `${SITE.currencySymbol}${value.toLocaleString('en-US')}`;
}

/** Whole-number discount percentage, or null when not on sale. */
export function discountPercent(price: number, original?: number): number | null {
  if (!original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}
