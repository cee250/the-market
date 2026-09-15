import { useState } from 'react';
import { Carousel, CarouselItem } from '../components/product/Carousel';
import { CategoryGrid } from '../components/product/CategoryGrid';
import { FeatureStrip } from '../components/product/FeatureStrip';
import { HeroCarousel } from '../components/product/HeroCarousel';
import { PromoTiles } from '../components/product/PromoTiles';
import { ProductCard } from '../components/product/ProductCard';
import { SellerBanner } from '../components/product/SellerBanner';
import { ProductGridSkeleton } from '../components/ui/Skeletons';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { cx } from '../lib/utils';
import type { ProductTag } from '../types';

const TABS: { key: ProductTag; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'latest', label: 'Latest' },
  { key: 'best-seller', label: 'Best Seller' },
];

export function HomePage() {
  const [tab, setTab] = useState<ProductTag>('featured');
  const collections = useAsync(() => api.getProducts({ tag: tab }), [tab]);
  const bestSellers = useAsync(
    () => api.getProducts({ tag: 'best-seller', sort: 'rating' }),
    [],
  );

  return (
    <>
      <HeroCarousel />
      <PromoTiles />

      {/* Shop collections — tabbed carousel */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <SectionHeading eyebrow="Our picks" title="Shop collections" />
        <div className="mb-5 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cx(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                tab === t.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {collections.loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <Carousel>
            {(collections.data ?? []).map((p) => (
              <CarouselItem key={p.id}>
                <ProductCard product={p} />
              </CarouselItem>
            ))}
          </Carousel>
        )}
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          action={{ label: 'View all', to: '/shop' }}
        />
        <CategoryGrid />
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <SectionHeading
          eyebrow="Top rated"
          title="Best sellers"
          action={{ label: 'View all', to: '/shop?tag=best-seller&sort=rating' }}
        />
        {bestSellers.loading ? (
          <ProductGridSkeleton count={4} />
        ) : (
          <Carousel>
            {(bestSellers.data ?? []).map((p) => (
              <CarouselItem key={p.id}>
                <ProductCard product={p} />
              </CarouselItem>
            ))}
          </Carousel>
        )}
      </section>

      <div className="pt-14">
        <SellerBanner />
      </div>

      <div className="mt-14">
        <FeatureStrip />
      </div>
      <div className="h-8" />
    </>
  );
}
