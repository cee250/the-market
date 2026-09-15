import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../lib/utils';

interface Slide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: { label: string; to: string };
  dark?: boolean;
}

const SLIDES: Slide[] = [
  {
    image: '/images/hero/sale.jpg',
    eyebrow: 'Season Sale',
    title: 'Fresh styles, fresh prices',
    subtitle: 'Up to 30% off across fashion, tech and home — for a limited time only.',
    cta: { label: 'Shop the sale', to: '/shop' },
    dark: true,
  },
  {
    image: '/images/hero/fashion.jpg',
    eyebrow: "Women's Fashion",
    title: 'Dress the season',
    subtitle: 'New arrivals from flowy summer dresses to leather crossbody bags.',
    cta: { label: "Shop Women's Fashion", to: '/category/womens-fashion' },
  },
  {
    image: '/images/hero/tech.jpg',
    eyebrow: 'Tech & Electronics',
    title: 'Power up your world',
    subtitle: 'The latest phones, laptops and smart home picks — delivered fast.',
    cta: { label: 'Explore Electronics', to: '/category/mobiles-computers' },
    dark: true,
  },
];

const AUTOPLAY_MS = 6500;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => setIndex((next + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [index, paused, go]);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div className="relative h-[320px] sm:h-[400px] lg:h-[460px]">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            className={cx(
              'absolute inset-0 transition-opacity duration-700',
              i === index ? 'z-10 opacity-100' : 'z-0 opacity-0',
            )}
            aria-hidden={i !== index}
          >
            <img
              src={slide.image}
              alt=""
              className={cx(
                'h-full w-full object-cover object-center transition-transform duration-[6500ms] ease-linear',
                i === index ? 'scale-105' : 'scale-100',
              )}
            />
            <div
              className={cx(
                'absolute inset-0',
                slide.dark
                  ? 'bg-gradient-to-r from-slate-950/75 via-slate-950/35 to-transparent'
                  : 'bg-gradient-to-r from-white/85 via-white/40 to-transparent',
              )}
            />
            <div className="absolute inset-0">
              <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
                <div
                  className={cx(
                    'max-w-lg transition-all delay-200 duration-700',
                    i === index ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  )}
                >
                  <p
                    className={cx(
                      'text-xs font-bold uppercase tracking-[0.2em]',
                      slide.dark ? 'text-emerald-300' : 'text-emerald-700',
                    )}
                  >
                    {slide.eyebrow}
                  </p>
                  <h1
                    className={cx(
                      'mt-3 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl',
                      slide.dark ? 'text-white' : 'text-slate-900',
                    )}
                  >
                    {slide.title}
                  </h1>
                  <p
                    className={cx(
                      'mt-3 max-w-md text-sm sm:text-base',
                      slide.dark ? 'text-slate-200' : 'text-slate-700',
                    )}
                  >
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.cta.to}
                    tabIndex={i === index ? 0 : -1}
                    className={cx(
                      'mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-lg transition',
                      slide.dark
                        ? 'bg-white text-slate-900 hover:bg-emerald-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700',
                    )}
                  >
                    {slide.cta.label}
                    <ArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur transition hover:bg-white/25 sm:flex"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cx(
              'h-2 rounded-full transition-all duration-300',
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80',
            )}
          />
        ))}
      </div>
    </section>
  );
}

function ArrowRight() {
  return <ChevronRight size={16} />;
}
