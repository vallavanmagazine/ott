/**
 * Revenue Reports — the finance view.
 *
 * Keeps the three money numbers separate rather than blending them into one
 * "revenue" figure:
 *   - top-ups      cash received from sponsors
 *   - spend        campaign budget consumed (already funded by a top-up)
 *   - wallet float unspent balance, which is a LIABILITY, not income
 * The previous version of this screen printed the same total under two
 * different labels; keeping the definitions explicit is what stops that.
 */
import { useCallback, useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, TrendingDown, Wallet, FileText, Download, RefreshCw } from 'lucide-react';
import { fetchRevenueReport, rupeesCompact, type RevenueReport } from '@/services/admin-stats';
import { useToast } from '@/components/admin/Toast';
import { rupees } from '@/lib/admin-options';
import { downloadCsv, datedFilename } from '@/lib/csv';
import { StatCard, SkeletonCards, SkeletonTable, EmptyState } from '@/components/admin/ui';

export function AdminRevenueReports() {
  const toast = useToast();
  const [r, setR] = useState<RevenueReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setR(await fetchRevenueReport());
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!r) {
    return (
      <div className="space-y-4">
        <SkeletonCards count={4} />
        <SkeletonTable rows={6} cols={4} />
      </div>
    );
  }

  const growth = r.lastMonthTopupRupees > 0
    ? ((r.thisMonthTopupRupees - r.lastMonthTopupRupees) / r.lastMonthTopupRupees) * 100
    : null;

  const maxBar = Math.max(1, ...r.byMonth.map((m) => Math.max(m.topupRupees, m.spendRupees)));

  const exportReport = () => {
    downloadCsv(
      datedFilename('vallavan-revenue'),
      ['Sponsor', 'Campaigns', 'Top-ups (₹)', 'Spend (₹)'],
      r.topSponsors.map((s) => [s.name, s.campaigns, s.topupRupees, s.spendRupees]),
    );
    toast.success('Revenue report exported');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2">
            <IndianRupee size={16} className="text-vgold" />
            <span className="text-[10px] text-vmuted uppercase tracking-wider font-bold">Top-up Revenue</span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{rupeesCompact(r.topupRupees)}</div>
          <div className="text-[10px] text-vmuted mt-0.5">Cash received from sponsors</div>
        </div>

        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-vred" />
            <span className="text-[10px] text-vmuted uppercase tracking-wider font-bold">Campaign Spend</span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{rupeesCompact(r.spendRupees)}</div>
          <div className="text-[10px] text-vmuted mt-0.5">Budget consumed by live ads</div>
        </div>

        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-blue-400" />
            <span className="text-[10px] text-vmuted uppercase tracking-wider font-bold">Wallet Float</span>
          </div>
          <div className="text-2xl font-black text-white mt-2">{rupeesCompact(r.walletLiabilityRupees)}</div>
          <div className="text-[10px] text-vmuted mt-0.5">Unspent — a liability, not income</div>
        </div>

        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2">
            {growth !== null && growth < 0
              ? <TrendingDown size={16} className="text-red-400" />
              : <TrendingUp size={16} className="text-green-400" />}
            <span className="text-[10px] text-vmuted uppercase tracking-wider font-bold">This Month</span>
          </div>
          <div className="text-2xl font-black text-vgold mt-2">{rupeesCompact(r.thisMonthTopupRupees)}</div>
          <div className={`text-[10px] mt-0.5 ${growth === null ? 'text-vmuted' : growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {growth === null
              ? 'No prior month to compare'
              : `${growth >= 0 ? '+' : ''}${growth.toFixed(0)}% vs last month`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Invoiced (incl. GST)" value={rupees(r.invoicedRupees)} accent="text-vgold" icon={<FileText size={13} />} />
        <StatCard label="GST Collected" value={rupees(r.gstRupees)} accent="text-blue-400" />
        <StatCard label="Sponsors with activity" value={r.topSponsors.length} />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={load}
          disabled={refreshing}
          className="px-3 py-2 rounded-lg glass text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={exportReport} className="px-3 py-2 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Paired bars: cash in vs inventory consumed, same axis */}
      <div className="p-5 rounded-xl glass">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-white">Top-ups vs Campaign Spend</h3>
          <div className="flex items-center gap-3 text-[10px] text-vmuted">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-vgold" /> Top-ups</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-vred" /> Spend</span>
          </div>
        </div>
        <p className="text-[10px] text-vmuted mb-4">Last 8 months</p>
        {r.byMonth.every((m) => m.topupRupees === 0 && m.spendRupees === 0) ? (
          <p className="text-xs text-vmuted py-8 text-center">No revenue data yet.</p>
        ) : (
          <div className="flex items-end justify-between gap-3 h-44">
            {r.byMonth.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div className="w-full flex-1 flex items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 max-w-[18px] rounded-t bg-vgold"
                    style={{ height: `${Math.max(2, (m.topupRupees / maxBar) * 100)}%` }}
                    title={`Top-ups ${rupees(m.topupRupees)}`}
                  />
                  <div
                    className="w-1/2 max-w-[18px] rounded-t bg-vred"
                    style={{ height: `${Math.max(2, (m.spendRupees / maxBar) * 100)}%` }}
                    title={`Spend ${rupees(m.spendRupees)}`}
                  />
                </div>
                <span className="text-[9px] text-vmuted">{m.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-sponsor breakdown */}
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Sponsors by Contribution</h3>
        {r.topSponsors.length === 0 ? (
          <EmptyState title="No sponsor revenue yet" hint="Top-ups and campaign spend appear here once sponsors are active." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                  <th className="text-left py-2 font-bold w-8">#</th>
                  <th className="text-left py-2 font-bold">Sponsor</th>
                  <th className="text-right py-2 font-bold">Campaigns</th>
                  <th className="text-right py-2 font-bold">Top-ups</th>
                  <th className="text-right py-2 font-bold">Spend</th>
                  <th className="text-right py-2 font-bold">Unspent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {r.topSponsors.map((s, i) => (
                  <tr key={s.name + i} className="hover:bg-white/5 transition">
                    <td className="py-2.5">
                      <span className="w-6 h-6 rounded-full bg-vgold/20 flex items-center justify-center text-[11px] font-bold text-vgold">
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-white">{s.name}</td>
                    <td className="py-2.5 text-right text-vmuted tabular-nums">{s.campaigns}</td>
                    <td className="py-2.5 text-right text-vgold font-bold tabular-nums">{rupees(s.topupRupees)}</td>
                    <td className="py-2.5 text-right text-white/80 tabular-nums">{rupees(s.spendRupees)}</td>
                    <td className="py-2.5 text-right text-blue-400 tabular-nums">
                      {rupees(Math.max(0, s.topupRupees - s.spendRupees))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
