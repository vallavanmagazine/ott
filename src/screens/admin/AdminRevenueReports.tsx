import { IndianRupee, TrendingUp } from 'lucide-react';

export function AdminRevenueReports() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const revenue = [45, 62, 58, 78, 72, 95, 88, 110];
  const adRev = [38, 52, 48, 65, 60, 80, 75, 92];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2">
            <IndianRupee size={16} className="text-vgold" />
            <span className="text-[10px] text-vmuted">Total Revenue</span>
          </div>
          <div className="text-2xl font-black text-white mt-2">₹12.4L</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-[10px] text-vmuted">Ad Revenue</span>
          </div>
          <div className="text-2xl font-black text-white mt-2">₹10.1L</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <span className="text-[10px] text-vmuted">This Month</span>
          <div className="text-2xl font-black text-vgold mt-2">₹1.1L</div>
        </div>
        <div className="p-4 rounded-xl glass">
          <span className="text-[10px] text-vmuted">Growth</span>
          <div className="text-2xl font-black text-green-400 mt-2">+18%</div>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-1">Revenue Over Time</h3>
        <p className="text-[10px] text-vmuted mb-4">Monthly breakdown (₹ in thousands)</p>
        <div className="flex items-end justify-between gap-3 h-40">
          {revenue.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex flex-col justify-end h-full relative">
                <div className="w-full rounded-t bg-vgold/60" style={{ height: `${adRev[i]}%` }} />
                <div className="w-full bg-vgold" style={{ height: `${v - adRev[i]}%`, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
              </div>
              <span className="text-[9px] text-vmuted">{months[i]}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-vgold" />
            <span className="text-[10px] text-vmuted">Ad Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-vgold/60" />
            <span className="text-[10px] text-vmuted">Sponsor Campaigns</span>
          </div>
        </div>
      </div>

      {/* Top earners */}
      <div className="p-5 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Top Earning Sponsors</h3>
        <div className="space-y-2.5">
          {[
            { name: 'Mylapore Silks', revenue: '₹4.5L' },
            { name: 'Tamil Tea Co.', revenue: '₹2.8L' },
            { name: 'A2B Foods', revenue: '₹1.9L' },
            { name: 'Chennai Motors', revenue: '₹0.9L' },
          ].map((s, i) => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-vgold/20 flex items-center justify-center text-[11px] font-bold text-vgold">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-white">{s.name}</span>
              </div>
              <span className="text-sm font-bold text-vgold">{s.revenue}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
