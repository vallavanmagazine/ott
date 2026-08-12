import { useState, useEffect } from 'react';
import { Users, Film, Building2, IndianRupee, TrendingUp, Eye, MousePointerClick } from 'lucide-react';
import { fetchDashboardStats, compact, rupeesCompact, type DashboardStats } from '@/services/admin-stats';

export function AdminDashboard() {
  const [s, setS] = useState<DashboardStats | null>(null);

  useEffect(() => { fetchDashboardStats().then(setS); }, []);

  const primary = [
    { icon: Users, label: 'Total Users', value: s ? s.users.toLocaleString('en-IN') : '…', color: '#1565C0' },
    { icon: Film, label: 'Total Documentaries', value: s ? String(s.documentaries) : '…', color: '#00838F' },
    { icon: Building2, label: 'Active Sponsors', value: s ? String(s.activeSponsors) : '…', color: '#D4AF37' },
    { icon: IndianRupee, label: 'Total Revenue', value: s ? rupeesCompact(s.revenueRupees) : '…', color: '#D32F2F' },
  ];
  const secondary = [
    { icon: Eye, label: 'Total Views', value: s ? compact(s.views) : '…' },
    { icon: MousePointerClick, label: 'Ad Clicks', value: s ? compact(s.clicks) : '…' },
    { icon: TrendingUp, label: 'Avg CTR', value: s ? `${s.ctr.toFixed(1)}%` : '…' },
    { icon: Users, label: 'New Users (7d)', value: s ? String(s.newUsers7d) : '…' },
  ];

  const weeks = s?.revenueByWeek ?? new Array(12).fill(0);
  const maxRev = Math.max(1, ...weeks);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {primary.map((c) => (
          <div key={c.label} className="p-4 rounded-xl glass">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${c.color}25` }}>
              <c.icon size={20} style={{ color: c.color }} />
            </div>
            <div className="text-2xl font-black text-white mt-3">{c.value}</div>
            <div className="text-[11px] text-vmuted mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondary.map((c) => (
          <div key={c.label} className="p-3.5 rounded-xl glass flex items-center gap-3">
            <c.icon size={18} className="text-vmuted" />
            <div>
              <div className="text-base font-black text-white">{c.value}</div>
              <div className="text-[10px] text-vmuted">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart — real weekly wallet credits */}
      <div className="p-5 rounded-xl glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Platform Revenue Over Time</h3>
            <p className="text-[10px] text-vmuted">Last 12 weeks (wallet top-ups)</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {weeks.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t bg-gradient-to-t from-vred to-vred/50" style={{ height: `${Math.max(2, (v / maxRev) * 100)}%` }} title={rupeesCompact(v)} />
              <span className="text-[9px] text-vmuted">W{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity — real audit logs */}
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
        <div className="space-y-2.5">
          {!s ? (
            <p className="text-xs text-vmuted">Loading…</p>
          ) : s.recentActivity.length === 0 ? (
            <p className="text-xs text-vmuted">No activity recorded yet.</p>
          ) : s.recentActivity.map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/90">{a.text}</span>
              <span className="text-[10px] text-vmuted flex-shrink-0 ml-3">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
