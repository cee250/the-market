import { Copy, Sparkles, TicketPercent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PROMO_OFFERS } from '../../config/site';
import { useToast } from '../../context/ToastContext';

const accents = { emerald: 'from-emerald-700 to-emerald-500', amber: 'from-amber-600 to-orange-400', sky: 'from-sky-700 to-cyan-500' } as const;

export function PromoBanner() {
  const { toast } = useToast();
  const copy = async (code: string) => { try { await navigator.clipboard.writeText(code); toast(`${code} copied — apply it in your cart.`); } catch { toast(`Use code ${code} at checkout.`); } };
  return <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6"><div className="overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-lg sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300"><Sparkles size={15} /> Limited-time offers</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">A little more joy in every cart.</h2><p className="mt-1 text-sm text-slate-300">Pick an offer, copy your code and apply it in the cart.</p></div><Link to="/shop" className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-emerald-50">Shop deals</Link></div><div className="mt-6 grid gap-3 md:grid-cols-3">{PROMO_OFFERS.map((offer) => <div key={offer.code} className={`rounded-2xl bg-gradient-to-br ${accents[offer.accent]} p-4`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold">{offer.title}</p><p className="mt-1 text-xs text-white/85">{offer.description}</p></div><TicketPercent size={20} className="text-white/80" /></div><button type="button" onClick={() => void copy(offer.code)} className="mt-4 flex w-full items-center justify-between rounded-lg bg-black/20 px-3 py-2 text-xs font-bold tracking-wider text-white transition hover:bg-black/30"><span>{offer.code} · {offer.percent}% OFF</span><Copy size={14} /></button></div>)}</div></div></section>;
}
