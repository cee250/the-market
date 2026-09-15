import { useRef, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../lib/utils';

interface CarouselProps {
  children: ReactNode;
  className?: string;
}

/** Horizontal snap carousel with hover-reveal arrow controls. */
export function Carousel({ children, className }: CarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className={cx('group relative', className)}>
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x gap-4 overflow-x-auto scroll-smooth px-1 pb-1"
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="absolute -left-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 sm:flex sm:opacity-0 sm:group-hover:opacity-100"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function CarouselItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('w-52 shrink-0 snap-start sm:w-64', className)}>{children}</div>;
}
