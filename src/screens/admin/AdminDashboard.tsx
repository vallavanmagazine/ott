import { Users, Film, Building2, IndianRupee, TrendingUp, Eye, MousePointerClick } from 'lucide-react';

export function AdminDashboard() {
  const stats = [
    { icon: Users, label: 'Total Users', value: '48,230', change: '+8.2%', color: '#1565C0' },
    { icon: Film, label: 'Total Documentaries', value: '127', change: '+3', color: '#00838F' },
    { icon: Building2, label: 'Active Sponsors', value: '34', change: '+5', color: '#D4AF37' },
    { icon: IndianRupee, label: 'Total Revenue', value: '₹12.4L', change: '+18%', color: '#D32F2F' },
  ];

  const secondary = [
    { icon: Eye, label: 'Total Views (30d)', value: '1.2M' },
    { icon: MousePointerClick, label: 'Ad Clicks (30d)', value: '48.5K' },
    { icon: TrendingUp, label: 'Avg CTR', value: '4.1%' },
    { icon: Users, label: 'New Users (7d)', value: '892' },
  ];

  const chartData = [35, 52, 48, 70, 62, 85, 78, 92, 68, 88, 75, 95];
  const days = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-4 rounded-xl glass">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}25` }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <span className="text-[11px] font-bold text-green-400">{s.change}</span>
            </div>
            <div className="text-2xl font-black text-white mt-3">{s.value}</div>
            <div className="text-[11px] text-vmuted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {secondary.map((s) => (
          <div key={s.label} className="p-3.5 rounded-xl glass flex items-center gap-3">
            <s.icon size={18} className="text-vmuted" />
            <div>
              <div className="text-base font-black text-white">{s.value}</div>
              <div className="text-[10px] text-vmuted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="p-5 rounded-xl glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Platform Revenue Over Time</h3>
            <p className="text-[10px] text-vmuted">Last 12 weeks</p>
          </div>
          <span className="text-xs font-bold text-green-400">+18% YoY</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {chartData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t bg-gradient-to-t from-vred to-vred/50" style={{ height: `${v}%` }} />
              <span className="text-[9px] text-vmuted">{days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
        <div className="space-y-2.5">
          {[
            { text: 'New sponsor "A2B Foods" joined', time: '2h ago' },
            { text: 'Campaign "Nilgiri Tea" approved', time: '5h ago' },
            { text: 'New documentary "Coastal Erosion" published', time: '8h ago' },
            { text: 'User "lakshmi.r" suspended', time: '1d ago' },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-white/90">{a.text}</span>
              <span className="text-[10px] text-vmuted">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
