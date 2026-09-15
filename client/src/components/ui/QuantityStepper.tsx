import { Minus, Plus } from 'lucide-react';
import { cx } from '../../lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const btn = cx(
    'flex items-center justify-center text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40',
    size === 'sm' ? 'h-8 w-8' : 'h-10 w-10',
  );

  return (
    <div
      className={cx(
        'inline-flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white',
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span
        className={cx(
          'select-none text-center text-sm font-medium tabular-nums',
          size === 'sm' ? 'w-8' : 'w-10',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
