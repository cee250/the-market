import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cx } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: { label: string; to: string };
  className?: string;
}

export function EmptyState({ icon: Icon, title, text, action, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-20 text-center', className)}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={28} strokeWidth={1.5} />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{text}</p>
      {action && (
        <Link
          to={action.to}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
