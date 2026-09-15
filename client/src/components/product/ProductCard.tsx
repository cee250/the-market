import { Link } from 'react-router-dom';
import { ArrowLeftRight, Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useCompare, COMPARE_LIMIT } from '../../context/CompareContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { Price } from '../ui/Price';
import { RatingStars } from '../ui/RatingStars';
import { cx, discountPercent } from '../../lib/utils';

/**
 * The core product tile — mirrors the reference site's card:
 * discount badge, wishlist / compare actions, hover "Add to Cart",
 * category, name, price pair and star rating.
 */
export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { toast } = useToast();

  const off = discountPercent(product.price, product.originalPrice);
  const isNew = product.tags.includes('new');
  const out = product.stock === 0;
  const wished = wishlist.has(product.id);
  const comparing = compare.has(product.id);

  const handleAdd = () => {
    if (out) return;
    addItem(product.id);
    toast(`${product.name} added to cart`);
  };

  const handleWishlist = () => {
    const added = wishlist.toggle(product.id);
    toast(added ? 'Added to wishlist' : 'Removed from wishlist', added ? 'success' : 'info');
  };

  const handleCompare = () => {
    if (comparing) {
      compare.toggle(product.id);
      toast('Removed from compare', 'info');
      return;
    }
    const added = compare.toggle(product.id);
    if (!added) toast(`You can compare up to ${COMPARE_LIMIT} products`, 'info');
    else toast('Added to compare');
  };

  const iconBtn =
    'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 shadow-sm backdrop-blur transition hover:scale-105';

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <Link to={`/product/${product.id}`} className="flex flex-1 flex-col" aria-label={product.name}>
        <div className="relative aspect-square overflow-hidden bg-slate-50">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={cx(
              'h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]',
              out && 'opacity-60 saturate-50',
            )}
          />
          {off != null && !out && (
            <span className="absolute left-3 top-3 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">
              {off}% Off
            </span>
          )}
          {isNew && off == null && !out && (
            <span className="absolute left-3 top-3 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">
              New
            </span>
          )}
          {out && (
            <span className="absolute inset-x-0 bottom-0 bg-slate-900/75 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-white">
              Out of stock
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {product.categoryName}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-emerald-700">
            {product.name}
          </h3>
          <Price value={product.price} original={product.originalPrice} size="sm" className="mt-1" />
          <RatingStars value={product.rating} count={product.reviewCount} size={13} className="mt-0.5" />
        </div>
      </Link>

      {/* Action overlay — kept outside the link so buttons remain valid, clickable HTML */}
      <div className="pointer-events-none absolute inset-x-0 top-0 aspect-square">
        <div className="absolute right-3 top-3 flex flex-col gap-2 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={handleWishlist}
            aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            className={cx(iconBtn, wished ? 'border-rose-200 text-rose-500' : 'text-slate-500 hover:text-rose-500')}
          >
            <Heart size={16} className={wished ? 'fill-rose-500' : ''} />
          </button>
          <button
            type="button"
            onClick={handleCompare}
            aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
            className={cx(iconBtn, comparing ? 'border-emerald-200 text-emerald-600' : 'text-slate-500 hover:text-emerald-600')}
          >
            <ArrowLeftRight size={15} />
          </button>
        </div>

        {!out && (
          <>
            {/* Desktop: full-width hover bar */}
            <button
              type="button"
              onClick={handleAdd}
              className="pointer-events-auto absolute inset-x-3 bottom-3 hidden translate-y-2 items-center justify-center gap-2 rounded-lg bg-slate-900/90 py-2.5 text-sm font-semibold text-white opacity-0 backdrop-blur transition duration-300 hover:bg-emerald-600 group-hover:translate-y-0 group-hover:opacity-100 sm:flex"
            >
              <ShoppingCart size={15} />
              Add to Cart
            </button>
            {/* Mobile: compact tap target */}
            <button
              type="button"
              onClick={handleAdd}
              aria-label="Add to cart"
              className="pointer-events-auto absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition active:scale-95 sm:hidden"
            >
              <ShoppingCart size={17} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
