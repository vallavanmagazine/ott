import { useState, useEffect } from 'react';
import { IndianRupee, Percent } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { logAdSale, fetchAdSales, type AdSaleRow, AD_SALES_COMMISSION } from '@/services/freelancer';

export function AdSalesScreen({ onBack }: { onBack: () => void }) {
  const [business, setBusiness] = useState('');
  const [sale, setSale] = useState(5000);
  const [sales, setSales] = useState<AdSaleRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetchAdSales().then(setSales);
  useEffect(() => { load(); }, []);

  const commission = Math.round(sale * AD_SALES_COMMISSION);
  const totalEarned = sales.reduce((s, r) => s + r.commissionRupees, 0);

  const submit = async () => {
    setError(null);
    if (!business.trim()) { setError('Enter the business name.'); return; }
    if (sale <= 0) { setError('Enter a valid sale amount.'); return; }
    setBusy(true);
    try { await logAdSale(business.trim(), sale); setBusiness(''); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Ad Sales" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        <div className="p-4 rounded-card glass-strong mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-vmuted font-bold"><Percent size={12} className="text-vgold" /> Commission Rate</div>
            <div className="text-2xl font-black text-vgold">{Math.round(AD_SALES_COMMISSION * 100)}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Earned</div>
            <div className="text-2xl font-black text-green-400">₹{totalEarned.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="p-5 rounded-card glass">
          <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Business Name</label>
          <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="e.g. Anand Sweets" className="w-full mt-1 mb-3 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
          <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Sale Amount (₹)</label>
          <input type="number" min={0} value={sale} onChange={(e) => setSale(Math.max(0, Number(e.target.value)))} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
          <div className="mt-3 p-3 rounded-xl bg-vgold/10 border border-vgold/30 flex items-center gap-2">
            <IndianRupee size={16} className="text-vgold" />
            <span className="text-xs text-white/90">Your commission: <span className="font-black text-vgold">₹{commission.toLocaleString('en-IN')}</span></span>
          </div>
          {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">{busy ? 'Logging…' : 'Log Ad Sale'}</button>
          <p className="text-[10px] text-vmuted text-center mt-2">Commission is confirmed after the sale is verified by admin.</p>
        </div>

        {sales.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">My Ad Sales</h3>
            <div className="space-y-2">
              {sales.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{s.businessName}</div>
                    <div className="text-[11px] text-vmuted">{s.date} · sale ₹{s.saleRupees.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-vgold">₹{s.commissionRupees.toLocaleString('en-IN')}</div>
                    <span className={`text-[9px] font-bold ${s.status === 'verified' ? 'text-green-400' : 'text-vmuted'}`}>{s.status}</span>
                  </div>
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
