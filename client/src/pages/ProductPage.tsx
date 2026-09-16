import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowRight,
  Heart,
  Minus,
  PackageX,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Carousel, CarouselItem } from '../components/product/Carousel';
import { ProductCard } from '../components/product/ProductCard';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { EmptyState } from '../components/ui/EmptyState';
import { Price } from '../components/ui/Price';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { RatingStars } from '../components/ui/RatingStars';
import { SectionHeading } from '../components/ui/SectionHeading';
import { LineSkeleton } from '../components/ui/Skeletons';
import { SITE } from '../config/site';
import { useCart } from '../context/CartContext';
import { useCompare, COMPARE_LIMIT } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useAsync } from '../hooks/useAsync';
import { cx, formatPrice, hashString } from '../lib/utils';
import { api } from '../services/api';

const TABS = ['Description', 'Specifications', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

const REVIEW_NAMES = ['Eric', 'Aline', 'Jean', 'Claudine', 'Dave', 'Keza', 'Pierre', 'Nadine'];
const REVIEW_COMMENTS = [
  'Delivered fast and the quality exceeded my expectations. Highly recommended!',
  'Exactly as described. Packaging was excellent and the support team was responsive.',
  'Great value for money. Will definitely buy again from Market.',
  'Solid product and a fair price. Delivery to Kigali took just two days.',
  'Very happy with the purchase — the team even called to confirm my order.',
];

interface MockReview {
  name: string;
  rating: number;
  date: string;
  comment: string;
}

function mockReviews(seed: string): MockReview[] {
  const h = hashString(seed);
  return Array.from({ length: 3 }).map((_, i) => ({
    name: REVIEW_NAMES[(h + i * 3) % REVIEW_NAMES.length],
    rating: h % 2 === 0 ? 5 : 4,
    date: new Date(Date.now() - ((h % 40) + i * 12 + 4) * 86400000).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    comment: REVIEW_COMMENTS[(h + i * 2) % REVIEW_COMMENTS.length],
  }));
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
      <div className="space-y-4 pt-2">
        <LineSkeleton className="w-1/4" />
        <LineSkeleton className="h-8 w-3/4" />
        <LineSkeleton className="w-1/3" />
        <LineSkeleton className="h-8 w-1/2" />
        <LineSkeleton className="w-full" />
        <LineSkeleton className="w-full" />
        <LineSkeleton className="w-2/3" />
        <div className="flex gap-3 pt-4">
          <LineSkeleton className="h-12 w-32" />
          <LineSkeleton className="h-12 flex-1" />
        </div>
      </div>
    </div>
  );
}

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const compare = useCompare();
  const wishlist = useWishlist();
  const { toast } = useToast();

  const product = useAsync(() => api.getProduct(id ?? ''), [id]);
  const related = useAsync(
    async () => (product.data ? api.getRelated(product.data, 8) : []),
    [product.data?.id],
  );

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>('Description');

  const reviews = useMemo(
    () => (product.data ? mockReviews(product.data.id) : []),
    [product.data],
  );

  if (product.loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (product.error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={PackageX}
          title="Marketplace temporarily unavailable"
          text="We couldn't load this product right now. Please try again in a moment."
          action={{ label: 'Return to marketplace', to: '/shop' }}
        />
      </div>
    );
  }

  const p = product.data;
  if (!p) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={PackageX}
          title="Product not found"
          text="This product may have been removed or the link is incorrect."
          action={{ label: 'Browse all products', to: '/shop' }}
        />
      </div>
    );
  }

  const out = p.stock === 0;
  const lowStock = !out && p.stock <= 5;
  const wished = wishlist.has(p.id);
  const comparing = compare.has(p.id);

  const handleAdd = (thenBuy = false) => {
    if (out) return;
    addItem(p.id, qty, p);
    if (thenBuy) navigate('/checkout');
    else toast(`${p.name} added to cart`);
  };

  const handleWishlist = () => {
    const added = wishlist.toggle(p.id);
    toast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
  };

  const handleCompare = () => {
    if (comparing) {
      compare.toggle(p.id);
      toast('Removed from compare', 'info');
      return;
    }
    const added = compare.toggle(p.id);
    if (!added) toast(`You can compare up to ${COMPARE_LIMIT} products`, 'info');
    else toast('Added to compare');
  };

  const specLabels = p.specs.map((s) => s.label);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: p.categoryName, to: `/category/${p.categorySlug}` },
          { label: p.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
            <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
          </div>
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleWishlist}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              className={cx(
                'flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-105',
                wished
                  ? 'border-rose-200 text-rose-500'
                  : 'border-slate-200 text-slate-500 hover:text-rose-500',
              )}
            >
              <Heart size={18} className={wished ? 'fill-rose-500' : ''} />
            </button>
            <button
              type="button"
              onClick={handleCompare}
              aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
              className={cx(
                'flex h-10 w-10 items-center justify-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition hover:scale-105',
                comparing
                  ? 'border-emerald-200 text-emerald-600'
                  : 'border-slate-200 text-slate-500 hover:text-emerald-600',
              )}
            >
              <ArrowLeftRight size={17} />
            </button>
          </div>
        </div>

        {/* Buy box */}
        <div>
          <Link
            to={`/category/${p.categorySlug}`}
            className="text-xs font-semibold uppercase tracking-wider text-emerald-600 hover:underline"
          >
            {p.categoryName}
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
            {p.name}
          </h1>
          <a href="#reviews" className="mt-2 inline-flex">
            <RatingStars value={p.rating} count={p.reviewCount} size={16} />
          </a>

          <div className="mt-5">
            <Price value={p.price} original={p.originalPrice} size="lg" />
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{p.description}</p>

          {/* Stock */}
          <p
            className={cx(
              'mt-4 flex items-center gap-2 text-sm font-medium',
              out ? 'text-rose-600' : lowStock ? 'text-amber-600' : 'text-emerald-700',
            )}
          >
            <span
              className={cx(
                'h-2 w-2 rounded-full',
                out ? 'bg-rose-500' : lowStock ? 'bg-amber-500' : 'bg-emerald-500',
              )}
            />
            {out
              ? 'Out of stock'
              : lowStock
                ? `Only ${p.stock} left in stock`
                : 'In stock, ready to ship'}
          </p>

          {/* Quantity + actions */}
          {!out && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityStepper
                value={qty}
                onChange={setQty}
                max={Math.max(1, p.stock)}
              />
              <button
                type="button"
                onClick={() => handleAdd(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => handleAdd(true)}
            disabled={out}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Buy Now
            <ArrowRight size={16} />
          </button>

          {/* Perks */}
          <ul className="mt-7 space-y-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-5 text-sm text-slate-700">
            <li className="flex items-center gap-3">
              <Truck size={17} className="shrink-0 text-emerald-600" />
              Free shipping on orders over {formatPrice(SITE.freeShippingThreshold)}
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw size={17} className="shrink-0 text-emerald-600" />
              7-day easy returns, no questions asked
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={17} className="shrink-0 text-emerald-600" />
              100% secure payment — MoMo, Airtel Money & cards
            </li>
          </ul>

          {/* Meta */}
          <dl className="mt-6 space-y-1.5 text-xs text-slate-500">
            <div className="flex gap-2">
              <dt className="font-semibold text-slate-600">SKU:</dt>
              <dd className="uppercase">{p.id}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold text-slate-600">Tags:</dt>
              <dd className="capitalize">{p.tags.join(', ')}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        <div className="flex gap-1 border-b border-slate-200" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cx(
                'relative -mb-px rounded-t-lg px-4 py-3 text-sm font-semibold transition sm:px-6',
                tab === t
                  ? 'border-b-2 border-emerald-600 text-emerald-700'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {t}
              {t === 'Reviews' && <span> ({p.reviewCount})</span>}
            </button>
          ))}
        </div>

        <div className="py-8" id={tab === 'Reviews' ? 'reviews' : undefined}>
          {tab === 'Description' && (
            <div className="max-w-3xl space-y-4 text-sm leading-relaxed text-slate-600">
              <p>{p.description}</p>
              <p>
                Every {SITE.name} order is quality-checked before dispatch and delivered with
                live tracking. If anything is not perfect, our 7-day return policy has you
                covered.
              </p>
            </div>
          )}

          {tab === 'Specifications' && (
            <div className="max-w-2xl overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody>
                  {p.specs.map((spec, i) => (
                    <tr key={spec.label} className={i % 2 === 0 ? 'bg-slate-50/70' : 'bg-white'}>
                      <th className="w-44 px-4 py-3 text-left font-semibold text-slate-700">
                        {spec.label}
                      </th>
                      <td className="px-4 py-3 text-slate-600">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Reviews' && (
            <div className="max-w-3xl space-y-5">
              {reviews.map((r) => (
                <article key={r.name + r.date} className="rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                        {r.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{r.name}</p>
                        <p className="text-xs text-slate-400">{r.date} · Verified purchase</p>
                      </div>
                    </div>
                    <RatingStars value={r.rating} size={13} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{r.comment}</p>
                </article>
              ))}
              <button
                type="button"
                onClick={() => toast('Reviews go live with the backend phase — stay tuned!', 'info')}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Write a review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.data && related.data.length > 0 && (
        <section className="mt-10">
          <SectionHeading eyebrow="You may also like" title="Related products" />
          <Carousel>
            {related.data.map((rp) => (
              <CarouselItem key={rp.id}>
                <ProductCard product={rp} />
              </CarouselItem>
            ))}
          </Carousel>
        </section>
      )}
    </div>
  );
}
