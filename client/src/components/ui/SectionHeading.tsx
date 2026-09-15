import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cx } from '../../lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  action?: { label: string; to: string };
  className?: string;
}

export function SectionHeading({ eyebrow, title, action, className }: SectionHeadingProps) {
  return (
    <div className={cx('mb-6 flex items-end justify-between gap-4', className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      </div>
      {action && (
        <Link
          to={action.to}
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          {action.label}
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
