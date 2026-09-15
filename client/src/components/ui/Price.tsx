import { cx, discountPercent, formatPrice } from '../../lib/utils';

interface PriceProps {
  value: number;
  original?: number;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<PriceProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

/** Current price + strikethrough original + discount badge. */
export function Price({ value, original, size = 'md', showBadge = true, className }: PriceProps) {
  const off = discountPercent(value, original);
  const hasOriginal = original != null && original > value;

  return (
    <span className={cx('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cx('font-semibold text-slate-900', SIZES[size])}>
        {formatPrice(value)}
      </span>
      {hasOriginal && (
        <span className="text-xs font-normal text-slate-400 line-through">
          {formatPrice(original)}
        </span>
      )}
      {showBadge && off != null && (
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          {off}% Off
        </span>
      )}
    </span>
  );
}
