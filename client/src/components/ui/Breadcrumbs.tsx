import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cx } from '../../lib/utils';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cx('flex flex-wrap items-center gap-1.5 text-xs text-slate-500', className)}
    >
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
          {item.to ? (
            <Link to={item.to} className="transition hover:text-emerald-700">
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[220px] truncate font-medium text-slate-800">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
