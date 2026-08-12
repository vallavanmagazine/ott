import { useState, useEffect } from 'react';
import { SubPageHeader } from '@/components/ScreenShell';
import { StatusTag } from './SponsorDashboard';
import { campaigns as mockCampaigns } from '@/data/mockData';
import { fetchMyCampaigns } from '@/services/sponsor';

export function MyCampaignsScreen({ onBack }: { onBack: () => void }) {
  const [campaigns, setCampaigns] = useState<typeof mockCampaigns[number][]>(mockCampaigns);

  useEffect(() => {
    fetchMyCampaigns().then(setCampaigns);
  }, []);

  const activeCount = campaigns.filter((c) => c.status === 'Active').length;
  const pendingCount = campaigns.filter((c) => c.status === 'Pending Approval').length;
  const endedCount = campaigns.filter((c) => c.status === 'Ended').length;

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="My Campaigns" onBack={onBack} />

      {/* Summary */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-card glass text-center">
            <div className="text-lg font-black text-green-400">{activeCount}</div>
            <div className="text-[9px] text-vmuted">Active</div>
          </div>
          <div className="p-2.5 rounded-card glass text-center">
            <div className="text-lg font-black text-vgold">{pendingCount}</div>
            <div className="text-[9px] text-vmuted">Pending</div>
          </div>
          <div className="p-2.5 rounded-card glass text-center">
            <div className="text-lg font-black text-vmuted">{endedCount}</div>
            <div className="text-[9px] text-vmuted">Ended</div>
          </div>
        </div>
      </div>

      {/* Campaign list */}
      <div className="px-4 mt-4 space-y-2.5">
        {campaigns.map((c) => (
          <button key={c.id} className="w-full p-3.5 rounded-card glass active:scale-[0.98] transition text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white flex-1 truncate">{c.name}</span>
              <StatusTag status={c.status} />
            </div>
            <div className="text-[10px] text-vmuted mb-2">Started {c.startDate}</div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <div>
                <div className="text-sm font-bold text-white">{(c.impressions / 1000).toFixed(1)}K</div>
                <div className="text-[8px] text-vmuted uppercase">Impressions</div>
              </div>
              <div>
                <div className="text-sm font-bold text-white">{c.clicks.toLocaleString('en-IN')}</div>
                <div className="text-[8px] text-vmuted uppercase">Clicks</div>
              </div>
              <div>
                <div className="text-sm font-bold text-vgold">₹{(c.spend / 1000).toFixed(1)}K</div>
                <div className="text-[8px] text-vmuted uppercase">Spend</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}
