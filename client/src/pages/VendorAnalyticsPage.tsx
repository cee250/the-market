import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, type AnalyticsReport } from '../services/analytics';

const money = (value: number) => `${value.toLocaleString()} RWF`;

export function VendorAnalyticsPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'VENDOR') void analyticsApi.vendor().then(setReport).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load analytics'));
  }, [user?.role]);

  if (!user || user.role !== 'VENDOR') return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-xl font-bold">Vendor access required</h1><Link to="/login" className="mt-4 inline-block font-semibold text-emerald-700">Sign in</Link></div>;

  return <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white"><BarChart3 size={22} /></span><div><h1 className="text-xl font-extrabold text-slate-900">Analytics</h1><p className="text-sm text-slate-500">Sales performance from your Market orders.</p></div></div>
    {error && <p className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!report && !error && <p className="mt-8 text-sm text-slate-500">Loading analytics…</p>}
    {report && <><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[['Orders', report.totalOrders.toLocaleString()], ['Completed', report.completedOrders.toLocaleString()], ['Units sold', report.unitsSold.toLocaleString()], ['Revenue', money(report.revenue)], ['Average order', money(report.averageOrderValue)]].map(([label, value]) => <div key={label} className="rounded-xl bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>)}</div><div className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><h2 className="font-bold text-slate-900">Top products</h2>{report.topProducts.length === 0 ? <p className="mt-4 text-sm text-slate-500">Sales data will appear here after your first order.</p> : <div className="mt-4 divide-y divide-slate-100">{report.topProducts.map((product) => <div key={product.name} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="font-semibold text-slate-800">{product.name}<span className="ml-2 font-normal text-slate-500">{product.unitsSold} units</span></span><span className="font-bold text-slate-900">{money(product.revenue)}</span></div>)}</div>}</div></>}
  </div>;
}
