import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, SearchX, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { ProductGridSkeleton } from '../components/ui/Skeletons';
import { CATEGORIES, categoryBySlug } from '../data/categories';
import { useAsync } from '../hooks/useAsync';
import { api, type SortKey } from '../services/api';
import { cx } from '../lib/utils';

const PAGE_SIZE = 12;

const TAG_TITLES: Record<string, string> = {
  featured: 'Featured',
  latest: 'New Arrivals',
  'best-seller': 'Best sellers',
  new: 'New Arrivals',
};

interface LocalFilters {
  minPrice: string;
  maxPrice: string;
  minRating: number;
  inStockOnly: boolean;
}

const EMPTY_FILTERS: LocalFilters = {
  minPrice: '',
  maxPrice: '',
  minRating: 0,
  inStockOnly: false,
};

function FiltersPanel({
  filters,
  setFilters,
  activeCategory,
}: {
  filters: LocalFilters;
  setFilters: (f: LocalFilters) => void;
  activeCategory?: string;
}) {
  const navigate = useNavigate();

  const commitPrice = (key: 'minPrice' | 'maxPrice', raw: string) => {
    const value = raw.replace(/[^0-9]/g, '');
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-7">
      {/* Categories */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Category</h3>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className={cx(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition',
                !activeCategory
                  ? 'bg-emerald-50 font-semibold text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              All Products
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => navigate(`/category/${c.slug}`)}
                className={cx(
                  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition',
                  activeCategory === c.slug
                    ? 'bg-emerald-50 font-semibold text-emerald-800'
                    : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                {c.shortName}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={filters.minPrice}
            onChange={(e) => commitPrice('minPrice', e.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <span className="text-slate-400">–</span>
          <input
            type="text"
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={(e) => commitPrice('maxPrice', e.target.value)}
            placeholder="Max"
            aria-label="Maximum price"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Press Enter or tap outside to apply.
        </p>
      </div>

      {/* Rating */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Rating</h3>
        <div className="flex flex-wrap gap-2">
          {[4, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilters({ ...filters, minRating: filters.minRating === r ? 0 : r })}
              className={cx(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                filters.minRating === r
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300',
              )}
            >
              {r}★ & up
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
          />
          In stock only
        </label>
      </div>

      <button
        type="button"
        onClick={() => setFilters(EMPTY_FILTERS)}
        className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
      >
        Clear all filters
      </button>
    </div>
  );
}

export function ListingPage({ mode }: { mode: 'shop' | 'category' | 'search' }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const q = mode === 'search' ? (searchParams.get('q') ?? '').trim() : undefined;
  const urlTag = searchParams.get('tag') ?? undefined;
  const urlSort = searchParams.get('sort') as SortKey | null;

  const [filters, setFilters] = useState<LocalFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey | ''>(urlSort ?? '');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mobileFilters, setMobileFilters] = useState(false);

  const category = mode === 'category' ? categoryBySlug.get(slug ?? '') : undefined;
  const unknownCategory = mode === 'category' && !category;

  const products = useAsync(
    () =>
      api.getProducts({
        category: category?.slug,
        tag: urlTag,
        q,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        minRating: filters.minRating || undefined,
        inStockOnly: filters.inStockOnly || undefined,
        sort: sort || undefined,
      }),
    [mode, category?.slug, urlTag, q, filters, sort],
  );

  // Reset pagination whenever the result set changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [products.data]);

  if (unknownCategory) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={SearchX}
          title="Category not found"
          text="This category doesn't exist. Browse all products instead."
          action={{ label: 'View all products', to: '/shop' }}
        />
      </div>
    );
  }

  const items = products.data ?? [];
  const shown = items.slice(0, visible);
  const hasMore = items.length > visible;

  const title = category
    ? category.name
    : q
      ? `Results for “${q}”`
      : urlTag
        ? (TAG_TITLES[urlTag] ?? 'Products')
        : 'All Products';

  const crumbs = category
    ? [
        { label: 'Home', to: '/' },
        { label: 'Shop', to: '/shop' },
        { label: category.shortName },
      ]
    : q
      ? [
          { label: 'Home', to: '/' },
          { label: 'Search', to: '/shop' },
          { label: `“${q}”` },
        ]
      : [
          { label: 'Home', to: '/' },
          { label: 'Shop' },
        ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Category hero banner */}
      {category && (
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          <img
            src={category.image}
            alt=""
            className="h-40 w-full object-cover sm:h-48"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{category.name}</h1>
            <p className="mt-1 max-w-md text-sm text-white/80">{category.description}</p>
          </div>
        </div>
      )}

      <Breadcrumbs items={crumbs} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
          {!products.loading && (
            <span className="text-sm text-slate-500">
              {items.length} product{items.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFilters(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
          <label className="sr-only" htmlFor="sort">
            Sort products
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Sort: Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_1fr]">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-36 rounded-2xl border border-slate-100 bg-white p-5">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-900">
              <SlidersHorizontal size={14} className="text-emerald-600" /> Filters
            </h2>
            <FiltersPanel
              filters={filters}
              setFilters={setFilters}
              activeCategory={category?.slug}
            />
          </div>
        </aside>

        {/* Grid */}
        <div>
          {products.loading ? (
            <ProductGridSkeleton count={8} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No products found"
              text="Try adjusting your filters, price range or search terms."
              action={{ label: 'Browse all products', to: '/shop' }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
                {shown.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    className="rounded-lg border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-800 transition hover:border-emerald-600 hover:text-emerald-700"
                  >
                    Load more ({items.length - visible} remaining)
                  </button>
                </div>
              )}
              {!hasMore && (
                <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <Check size={13} /> You've viewed all {items.length} products
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      <Drawer open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filters">
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          activeCategory={category?.slug}
        />
        <button
          type="button"
          onClick={() => setMobileFilters(false)}
          className="mt-8 w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Show {items.length} result{items.length === 1 ? '' : 's'}
        </button>
      </Drawer>

      {/* Quick link used by the "All Products" crumb in search mode */}
      {mode === 'search' && q && (
        <p className="mt-6 text-sm text-slate-500">
          Looking for something specific?{' '}
          <Link to="/shop" className="font-semibold text-emerald-700 hover:underline">
            Browse all products
          </Link>
        </p>
      )}
    </div>
  );
}
