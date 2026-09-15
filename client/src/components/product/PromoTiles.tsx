import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const TILES = [
  {
    title: 'New Arrivals',
    image: '/images/categories/beauty-health.jpg',
    to: '/shop?tag=latest',
  },
  {
    title: 'Fashion Trends',
    image: '/images/categories/womens-fashion.jpg',
    to: '/category/womens-fashion',
  },
  {
    title: 'Home Decor',
    image: '/images/categories/home-kitchen.jpg',
    to: '/category/home-kitchen-pets',
  },
];

/** Three editorial tiles under the hero — same pattern as the reference site. */
export function PromoTiles() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {TILES.map((tile) => (
          <Link
            key={tile.title}
            to={tile.to}
            className="group relative block h-56 overflow-hidden rounded-2xl sm:h-64"
          >
            <img
              src={tile.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="text-lg font-bold text-white">{tile.title}</h3>
              <p className="mt-0.5 text-sm text-white/75">Discover curated products</p>
              <span className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                Shop now
                <ArrowRight
                  size={15}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
