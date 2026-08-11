import {
  Megaphone, TrendingUp, MousePointerClick, IndianRupee,
  ChevronRight, Plus, BarChart3, Eye,
} from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { campaigns } from '@/data/mockData';

export function SponsorDashboard({ onBack, onNavigate }: { onBack: () => void; onNavigate: (item: string) => void }) {
  const active = campaigns.filter((c) => c.status === 'Active').length;
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImp = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const ctr = ((totalClicks / totalImp) * 100).toFixed(1);

  const stats = [
    { icon: Megaphone, label: 'Active Campaigns', value: String(active), color: '#D32F2F' },
    { icon: IndianRupee, label: 'Total Spend', value: `₹${totalSpend.toLocaleString('en-IN')}`, color: '#D4AF37' },
    { icon: Eye, label: 'Impressions', value: totalImp.toLocaleString('en-IN'), color: '#1565C0' },
    { icon: MousePointerClick, label: 'Clicks', value: totalClicks.toLocaleString('en-IN'), color: '#00838F' },
  ];

  const quickActions = [
    { label: 'Create Campaign', icon: Plus, key: 'create-campaign' },
    { label: 'My Campaigns', icon: BarChart3, key: 'my-campaigns' },
    { label: 'AI Studio', icon: Megaphone, key: 'ai-studio' },
    { label: 'Campaign Analytics', icon: TrendingUp, key: 'campaign-analytics' },
  ];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Sponsor Dashboard" onBack={onBack} />

      {/* Stats grid */}
      <section className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="p-3.5 rounded-card glass">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${s.color}25` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div className="text-lg font-black text-white leading-tight">{s.value}</div>
              <div className="text-[10px] text-vmuted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3.5 rounded-card glass flex items-center justify-between">
          <div>
            <div className="text-[10px] text-vmuted">Average CTR</div>
            <div className="text-2xl font-black text-vgold">{ctr}%</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-vmuted">This Month</div>
            <div className="text-sm font-bold text-white">+12.5%</div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="px-4 mt-5">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Quick Actions</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          {quickActions.map((a) => (
            <button
              key={a.key}
              onClick={() => onNavigate(a.key)}
              className="w-full flex items-center gap-3 px-3.5 py-3 active:bg-white/5 transition"
            >
              <a.icon size={18} className="text-vgold" />
              <span className="flex-1 text-left text-sm font-semibold text-white">{a.label}</span>
              <ChevronRight size={16} className="text-vmuted" />
            </button>
          ))}
        </div>
      </section>

      {/* Recent campaigns */}
      <section className="px-4 mt-5">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Recent Campaigns</h3>
        <div className="space-y-2.5">
          {campaigns.slice(0, 2).map((c) => (
            <div key={c.id} className="p-3.5 rounded-card glass">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{c.name}</span>
                <StatusTag status={c.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                <Stat label="Impressions" value={(c.impressions / 1000).toFixed(1) + 'K'} />
                <Stat label="Clicks" value={c.clicks.toLocaleString('en-IN')} />
                <Stat label="Spend" value={`₹${(c.spend / 1000).toFixed(1)}K`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-bold text-white">{value}</div>
      <div className="text-[9px] text-vmuted">{label}</div>
    </div>
  );
}

export function StatusTag({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: 'bg-green-500/20 text-green-400 border-green-500/30',
    'Pending Approval': 'bg-vgold/20 text-vgold border-vgold/30',
    Ended: 'bg-white/10 text-vmuted border-white/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${styles[status] || styles.Ended}`}>
      {status}
    </span>
  );
}
