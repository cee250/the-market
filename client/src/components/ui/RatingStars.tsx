import { Star } from 'lucide-react';
import { cx } from '../../lib/utils';

interface RatingStarsProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
}

/** Five stars with fractional fill, optional review count. */
export function RatingStars({ value, count, size = 14, className }: RatingStarsProps) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const stars = (color: string, label: string) => (
    <span className={cx('flex', color)} aria-hidden={label === 'fill'}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className="shrink-0 fill-current" strokeWidth={0} />
      ))}
    </span>
  );

  return (
    <span className={cx('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-block" role="img" aria-label={`Rated ${value} out of 5`}>
        {stars('text-slate-300', 'base')}
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          {stars('text-amber-400', 'fill')}
        </span>
      </span>
      {count != null && (
        <span className="text-xs text-slate-500">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
