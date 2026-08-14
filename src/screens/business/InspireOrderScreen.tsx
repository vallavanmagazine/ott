import { useState, useEffect } from 'react';
import { Sparkles, Clock, Gift, BookOpen, Copy, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { getCurrentSponsorId } from '@/services/sponsor';
import { fetchInspirePackages, type InspirePackage } from '@/services/pricing';
import { createInspireOrder, fetchMyInspireOrders, type InspireOrder } from '@/services/inspire-orders';

export function InspireOrderScreen({ onBack }: { onBack: () => void }) {
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [packages, setPackages] = useState<InspirePackage[]>([]);
  const [orders, setOrders] = useState<InspireOrder[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInspirePackages().then(setPackages);
    getCurrentSponsorId().then((id) => {
      setSponsorId(id);
      if (id) fetchMyInspireOrders(id).then(setOrders);
    });
  }, []);

  const order = async (pkg: InspirePackage) => {
    setError(null);
    if (!sponsorId) { setError('Complete sponsor signup first.'); return; }
    setBusy(pkg.id);
    try {
      const res = await createInspireOrder({ sponsorId, packageId: pkg.id, packageName: pkg.name, priceRupees: pkg.priceRupees });
      setLink(res.shortUrl);
      fetchMyInspireOrders(sponsorId).then(setOrders);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const copy = () => { if (link) { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Inspire PR Video" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        <div className="p-4 rounded-card glass-strong mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-vgold" />
            <span className="text-sm font-black text-white">Professional PR feature</span>
          </div>
          <p className="text-[11px] text-vmuted mt-1">A produced video story about your brand, placed in the Inspire feed. Includes wallet credit toward ad campaigns.</p>
        </div>

        {error && <p className="text-[11px] text-vred mb-3">{error}</p>}

        <div className="space-y-3">
          {packages.map((p) => (
            <div key={p.id} className="p-4 rounded-card glass border border-vgold/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-black text-white">{p.name}</div>
                  {p.description && <div className="text-[11px] text-vmuted mt-0.5">{p.description}</div>}
                </div>
                <div className="text-lg font-black text-vgold">₹{p.priceRupees.toLocaleString('en-IN')}</div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-[11px] text-white/80">
                <span className="flex items-center gap-1"><Clock size={13} className="text-vmuted" /> {p.durationMin} min video</span>
                {p.freeCreditRupees > 0 && <span className="flex items-center gap-1"><Gift size={13} className="text-vgold" /> ₹{p.freeCreditRupees.toLocaleString('en-IN')} wallet credit</span>}
                {p.includesMagazine && <span className="flex items-center gap-1"><BookOpen size={13} className="text-vmuted" /> Magazine feature</span>}
              </div>
              <button onClick={() => order(p)} disabled={busy === p.id} className="w-full mt-3 py-2.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
                {busy === p.id ? 'Creating order…' : 'Order & Get Payment Link'}
              </button>
            </div>
          ))}
          {packages.length === 0 && <div className="p-6 rounded-card glass text-center text-sm text-vmuted">No packages available.</div>}
        </div>

        {link && (
          <div className="mt-4 p-4 rounded-card glass">
            <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold mb-2">Payment link ready</div>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className="flex-1 px-3 py-2.5 rounded-lg glass text-xs text-white outline-none" />
              <button onClick={copy} className="w-10 h-10 flex items-center justify-center rounded-lg bg-vred text-white">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            </div>
            <p className="text-[10px] text-vgold mt-2">Razorpay test mode — production begins after payment confirms.</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">My Orders</h3>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{o.packageName} · ₹{o.paidRupees.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-vmuted">{o.date} · production: {o.productionStatus}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${o.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-vgold/15 text-vgold'}`}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
