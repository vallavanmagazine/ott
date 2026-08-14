import { useState, useEffect } from 'react';
import { BookOpen, TrendingUp } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import {
  createMagazineOrder, fetchMagazineOrders, type MagazineOrderRow,
  MAGAZINE_COST_RUPEES, MAGAZINE_SELL_RUPEES,
} from '@/services/freelancer';

const QTY_PRESETS = [10, 25, 50, 100];

export function MagazineResellerScreen({ onBack }: { onBack: () => void }) {
  const [qty, setQty] = useState(25);
  const [orders, setOrders] = useState<MagazineOrderRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetchMagazineOrders().then(setOrders);
  useEffect(() => { load(); }, []);

  const marginPer = MAGAZINE_SELL_RUPEES - MAGAZINE_COST_RUPEES;
  const cost = qty * MAGAZINE_COST_RUPEES;
  const profit = qty * marginPer;

  const place = async () => {
    setError(null);
    setBusy(true);
    try { await createMagazineOrder(qty); load(); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Magazine Reseller" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        <div className="p-4 rounded-card glass-strong mb-4">
          <div className="flex items-center gap-2"><BookOpen size={18} className="text-vgold" /><span className="text-sm font-black text-white">Buy at ₹{MAGAZINE_COST_RUPEES}, sell at ₹{MAGAZINE_SELL_RUPEES}</span></div>
          <p className="text-[11px] text-vmuted mt-1">Keep ₹{marginPer} margin on every copy — that's a {Math.round((marginPer / MAGAZINE_COST_RUPEES) * 100)}% return.</p>
        </div>

        <div className="p-5 rounded-card glass">
          <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Quantity</label>
          <div className="grid grid-cols-4 gap-2 mt-1 mb-3">
            {QTY_PRESETS.map((q) => (
              <button key={q} onClick={() => setQty(q)} className={`py-2.5 rounded-xl text-sm font-bold transition active:scale-95 ${qty === q ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{q}</button>
            ))}
          </div>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-full px-4 py-3 rounded-xl glass text-sm text-white outline-none" />

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl glass text-center">
              <div className="text-[10px] text-vmuted uppercase tracking-wider font-bold">Your Cost</div>
              <div className="text-xl font-black text-white">₹{cost.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 rounded-xl bg-vgold/10 border border-vgold/30 text-center">
              <div className="text-[10px] text-vmuted uppercase tracking-wider font-bold flex items-center justify-center gap-1"><TrendingUp size={11} className="text-vgold" /> Profit</div>
              <div className="text-xl font-black text-vgold">₹{profit.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
          <button onClick={place} disabled={busy} className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">{busy ? 'Placing order…' : `Order ${qty} Copies (₹${cost.toLocaleString('en-IN')})`}</button>
        </div>

        {orders.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Order History</h3>
            <div className="space-y-2">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{o.quantity} copies · ₹{o.totalRupees.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-vmuted">{o.date} · potential profit ₹{o.potentialProfitRupees.toLocaleString('en-IN')}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-vgold/15 text-vgold">{o.status}</span>
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
