import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp } from 'lucide-react';
import { fetchRevenueReport, rupeesCompact, type RevenueReport } from '@/services/admin-stats';

export function AdminRevenueReports() {
  const [r, setR] = useState<RevenueReport | null>(null);
  useEffect(() => { fetchRevenueReport().then(setR); }, []);

  const months = r?.byMonth ?? [];
  const maxRev = Math.max(1, ...months.map((m) => m.rupees));
  const growth = months.length >= 2 && months[months.length - 2].rupees > 0
    ? (((months[months.length - 1].rupees - months[months.length - 2].rupees) / months[months.length - 2].rupees) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2"><IndianRupee size={16} className="text-vgold" /><span className="text-[10px] text-vmuted">Total Revenue</span></div>
          <div className="text-2xl font-black text-white mt-2">{r ? rupeesCompact(r.totalRupees) : '…'}</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2"><TrendingUp size={16} className="text-green-400" /><span className="text-[10px] text-vmuted">Sponsor Campaigns</span></div>
          <div className="text-2xl font-black text-white mt-2">{r ? rupeesCompact(r.totalRupees) : '…'}</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <span className="text-[10px] text-vmuted">This Month</span>
          <div className="text-2xl font-black text-vgold mt-2">{r ? rupeesCompact(r.thisMonthRupees) : '…'}</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <span className="text-[10px] text-vmuted">MoM Growth</span>
          <div className={`text-2xl font-black mt-2 ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>{growth >= 0 ? '+' : ''}{growth.toFixed(0)}%</div>
        </div>
      </div>

      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-1">Revenue Over Time</h3>
        <p className="text-[10px] text-vmuted mb-4">Last 8 months (sponsor campaign spend)</p>
        <div className="flex items-end justify-between gap-3 h-40">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t bg-vgold" style={{ height: `${Math.max(2, (m.rupees / maxRev) * 100)}%` }} title={rupeesCompact(m.rupees)} />
              <span className="text-[9px] text-vmuted">{m.label}</span>
            </div>
          ))}
          {months.length === 0 && <p className="text-xs text-vmuted">No revenue data yet.</p>}
        </div>
      </div>

      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Top Earning Sponsors</h3>
        <div className="space-y-2.5">
          {r && r.topSponsors.length > 0 ? r.topSponsors.map((sp, i) => (
            <div key={sp.name + i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-vgold/20 flex items-center justify-center text-[11px] font-bold text-vgold">{i + 1}</span>
                <span className="text-sm font-semibold text-white">{sp.name}</span>
              </div>
              <span className="text-sm font-bold text-vgold">{rupeesCompact(sp.rupees)}</span>
            </div>
          )) : <p className="text-xs text-vmuted">No sponsor revenue yet.</p>}
        </div>
      </div>
    </div>
  );
}
