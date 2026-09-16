import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';

export function CategoryGrid() {
  const categories = useAsync(() => api.getCategories(), []);
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"><Link to="/shop" className="group relative flex h-48 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 sm:col-span-2 sm:h-48 lg:col-span-1"><div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 transition duration-500 group-hover:scale-125" /><div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/10" /><ShoppingBag size={22} className="mb-6 text-white/90" /><h3 className="relative text-base font-bold text-white">All Products</h3><p className="relative text-xs text-emerald-100">Everything in one place</p></Link>{(categories.data ?? []).map((category) => <Link key={category.slug} to={`/category/${category.slug}`} className="group relative block h-48 overflow-hidden rounded-2xl"><img src={category.image} alt={category.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-4"><h3 className="text-sm font-bold text-white sm:text-base">{category.shortName}</h3><p className="mt-0.5 text-xs text-white/70">Browse collection</p></div></Link>)}</div>;
}
