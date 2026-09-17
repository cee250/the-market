import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CircleDollarSign, LayoutDashboard, Package, Settings, Shield, Store } from 'lucide-react';

export function AdminNavigation({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const links = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/vendors', label: 'Vendor operations', icon: Store },
    { href: '/admin/payments', label: 'Payments', icon: CircleDollarSign },
    { href: '/admin/categories', label: 'Catalog', icon: Package },
  ];
  return <div className="min-h-screen bg-slate-950 text-slate-200"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 p-5 lg:block"><div className="flex items-center gap-3 text-white"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500"><Shield size={21} /></span><div><p className="font-black tracking-tight">MARKET</p><p className="text-[10px] uppercase tracking-widest text-emerald-400">Control center</p></div></div><nav className="mt-10 space-y-1 text-sm">{links.map(({ href, label, icon: Icon }) => <Link key={href} to={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 font-semibold transition ${pathname === href ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}><Icon size={17} />{label}</Link>)}</nav><div className="absolute bottom-5 left-5 right-5"><Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"><Settings size={17} />Admin settings</Link><Link to="/" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:text-white">← Return to storefront</Link></div></aside><main className="min-h-screen lg:ml-64">{children}</main></div>;
}
