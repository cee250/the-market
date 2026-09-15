import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Store } from 'lucide-react';
import { shopsApi, type Shop } from '../services/shops';

export function PublicShopPage() {
  const { slug = '' } = useParams(); const [shop, setShop] = useState<Shop | null>(null); const [error, setError] = useState('');
  useEffect(() => { void shopsApi.public(slug).then(setShop).catch((err) => setError(err instanceof Error ? err.message : 'Shop not found')); }, [slug]);
  if (error) return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-xl font-bold">Shop not found</h1><p className="mt-2 text-sm text-slate-500">This shop may be inactive, suspended, or expired.</p><Link to="/shop" className="mt-4 inline-block font-semibold text-emerald-700">Browse marketplace</Link></div>;
  if (!shop) return <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-slate-500">Loading shop…</div>;
  return <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="rounded-2xl bg-white p-8 shadow-sm"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white"><Store size={26} /></span><div><h1 className="text-2xl font-extrabold text-slate-900">{shop.businessName}</h1><p className="text-sm text-slate-500">{shop.location} · {shop.phone}</p></div></div><p className="mt-6 text-slate-600">{shop.description || 'Welcome to our Market shop.'}</p><div className="mt-6 flex flex-wrap gap-3">{shop.socialLinks.map((link) => <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium capitalize text-slate-700 hover:bg-emerald-50 hover:text-emerald-700">{link.platform}<ExternalLink size={13} /></a>)}</div></div><div className="mt-6 rounded-2xl bg-white p-8 shadow-sm"><h2 className="font-bold text-slate-900">Products</h2><p className="mt-2 text-sm text-slate-500">This shop is ready for products. Product publishing arrives in the next phase.</p></div></div>;
}
