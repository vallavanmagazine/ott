import { TrendingUp, MousePointerClick, Eye, IndianRupee } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';

export function CampaignAnalyticsScreen({ onBack }: { onBack: () => void }) {
  const metrics = [
    { icon: Eye, label: 'Impressions', value: '423.7K', change: '+18%', color: '#1565C0' },
    { icon: MousePointerClick, label: 'Clicks', value: '16.3K', change: '+9%', color: '#00838F' },
    { icon: TrendingUp, label: 'CTR', value: '3.85%', change: '+0.4%', color: '#D4AF37' },
    { icon: IndianRupee, label: 'Spend', value: '₹75.7K', change: '+12%', color: '#D32F2F' },
  ];

  // mock bar chart data
  const chartData = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 100];
  const days = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Campaign Analytics" onBack={onBack} />

      <div className="px-4 mt-4">
        {/* Time range */}
        <div className="flex gap-1 p-1 rounded-full glass mb-4">
          {['7D', '30D', '90D', 'All'].map((r, i) => (
            <button
              key={r}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition ${
                i === 1 ? 'bg-vred text-white' : 'text-vmuted'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {metrics.map((m) => (
            <div key={m.label} className="p-3.5 rounded-card glass">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.color}25` }}>
                  <m.icon size={15} style={{ color: m.color }} />
                </div>
                <span className="text-[10px] font-bold text-green-400">{m.change}</span>
              </div>
              <div className="text-lg font-black text-white mt-2">{m.value}</div>
              <div className="text-[10px] text-vmuted">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="p-4 rounded-card glass">
          <h3 className="text-sm font-bold text-white mb-1">Impressions Over Time</h3>
          <p className="text-[10px] text-vmuted mb-4">Last 12 weeks</p>
          <div className="flex items-end justify-between gap-1 h-32">
            {chartData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-vred to-vred/60"
                  style={{ height: `${v}%` }}
                />
                <span className="text-[8px] text-vmuted">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line chart placeholder for CTR */}
        <div className="p-4 rounded-card glass mt-3">
          <h3 className="text-sm font-bold text-white mb-1">CTR Trend</h3>
          <p className="text-[10px] text-vmuted mb-4">Click-through rate over time</p>
          <div className="relative h-24">
            <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
              <polyline
                points="0,60 30,45 60,50 90,35 120,40 150,25 180,30 210,20 240,28 270,15 300,22"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
              />
              <polyline
                points="0,60 30,45 60,50 90,35 120,40 150,25 180,30 210,20 240,28 270,15 300,22 300,80 0,80"
                fill="url(#goldGrad)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Top performing */}
        <div className="p-4 rounded-card glass mt-3">
          <h3 className="text-sm font-bold text-white mb-3">Top Performing Content</h3>
          <div className="space-y-2.5">
            {[
              { name: 'Nilgiri Tea — Summer Push', ctr: '4.2%' },
              { name: 'A2B Festive Thali', ctr: '3.8%' },
              { name: 'Chennai Motors EV', ctr: '3.5%' },
            ].map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-vgold/20 flex items-center justify-center text-[10px] font-bold text-vgold">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-white">{c.name}</span>
                </div>
                <span className="text-xs font-bold text-vgold">{c.ctr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
