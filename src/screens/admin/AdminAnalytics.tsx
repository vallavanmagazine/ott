import { useState, useEffect } from 'react';
import { Building2, Megaphone, Wallet, IndianRupee, Users, Sparkles, Percent, FileText } from 'lucide-react';
import { fetchPlatformAnalytics, type PlatformAnalytics } from '@/services/admin-analytics';

export function AdminAnalytics() {
  const [a, setA] = useState<PlatformAnalytics | null>(null);

  useEffect(() => { fetchPlatformAnalytics().then(setA); }, []);

  if (!a) return <div className="p-8 text-center text-sm text-vmuted">Loading analytics…</div>;

  const money = (r: number) => r >= 100000 ? `₹${(r / 100000).toFixed(1)}L` : `₹${r.toLocaleString('en-IN')}`;
  const maxRev = Math.max(1, ...a.monthlyRevenue.map((m) => m.rupees));

  const tiles = [
    { icon: IndianRupee, label: 'Top-up Revenue', value: money(a.topupRevenueRupees), color: '#D4AF37' },
    { icon: FileText, label: 'Invoiced Revenue', value: money(a.invoiceRevenueRupees), color: '#00838F' },
    { icon: Wallet, label: 'Wallet Balances', value: money(a.walletBalanceRupees), color: '#1565C0' },
    { icon: Building2, label: 'Sponsors', value: String(a.sponsors), color: '#D32F2F' },
    { icon: Megaphone, label: 'Active Campaigns', value: String(a.activeCampaigns), color: '#7B1FA2' },
    { icon: Users, label: 'Freelancers', value: `${a.freelancers} (${a.pendingFreelancers} pending)`, color: '#2E7D32' },
    { icon: Sparkles, label: 'Inspire Orders', value: String(a.inspireOrders), color: '#EF6C00' },
    { icon: Percent, label: 'Ad-sales Commission', value: money(a.adSalesCommissionRupees), color: '#00695C' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="p-3.5 rounded-xl glass">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${t.color}25` }}>
              <t.icon size={18} style={{ color: t.color }} />
            </div>
            <div className="text-lg font-black text-white leading-tight">{t.value}</div>
            <div className="text-[10px] text-vmuted mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-4">Top-up Revenue — last 6 months</h3>
        <div className="flex items-end gap-3 h-40">
          {a.monthlyRevenue.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                <div className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-vred to-vgold transition-all"
                  style={{ height: `${Math.max(4, (m.rupees / maxRev) * 100)}%` }} title={`₹${m.rupees.toLocaleString('en-IN')}`} />
              </div>
              <div className="text-[10px] text-vmuted">{m.month}</div>
              <div className="text-[9px] text-white/60">{m.rupees >= 1000 ? `₹${(m.rupees / 1000).toFixed(0)}k` : `₹${m.rupees}`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
