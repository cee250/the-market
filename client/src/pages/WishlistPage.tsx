import { Heart } from 'lucide-react';
import { ProductCard } from '../components/product/ProductCard';
import { EmptyState } from '../components/ui/EmptyState';
import { useWishlist } from '../context/WishlistContext';
import { productById } from '../data/products';
import type { Product } from '../types';

export function WishlistPage() {
  const { ids } = useWishlist();
  const products = ids
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Wishlist{' '}
        {products.length > 0 && (
          <span className="text-base font-normal text-slate-500">
            ({products.length} product{products.length === 1 ? '' : 's'})
          </span>
        )}
      </h1>

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          text="Tap the heart on any product to save it here for later."
          action={{ label: 'Discover products', to: '/shop' }}
        />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
