import { useState, useEffect } from 'react';
import { Wallet, Clock } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { fetchMyEarnings, type EarningRow } from '@/services/freelancer';

export function FreelancerEarningsScreen({ onBack }: { onBack: () => void }) {
  const [rows, setRows] = useState<EarningRow[]>([]);
  const [total, setTotal] = useState(0);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEarnings().then((r) => { setRows(r.rows); setTotal(r.totalRupees); setPending(r.pendingRupees); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="My Earnings" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-card glass-strong">
            <div className="flex items-center gap-2 mb-1"><Wallet size={16} className="text-green-400" /><span className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Paid</span></div>
            <div className="text-2xl font-black text-green-400">₹{total.toLocaleString('en-IN')}</div>
          </div>
          <div className="p-4 rounded-card glass-strong">
            <div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-vgold" /><span className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Pending</span></div>
            <div className="text-2xl font-black text-vgold">₹{pending.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 mt-5 px-1">Earnings History</h3>
        {loading ? (
          <div className="p-6 rounded-card glass text-center text-sm text-vmuted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 rounded-card glass text-center text-sm text-vmuted">No earnings yet. Complete tasks, resell magazines, or sell ads to earn.</div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
                <div className="flex-1">
                  <div className="text-sm font-bold text-white capitalize">{r.type.replace(/_/g, ' ')}</div>
                  <div className="text-[11px] text-vmuted">{r.description || r.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-white">₹{r.amountRupees.toLocaleString('en-IN')}</div>
                  <span className={`text-[9px] font-bold ${r.status === 'paid' ? 'text-green-400' : 'text-vgold'}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
