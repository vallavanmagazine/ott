import { useState, useEffect } from 'react';
import { Check, X, IndianRupee } from 'lucide-react';
import { adminPendingCampaigns as mockPendingCampaigns } from '@/data/mockData';
import { fetchAdminPendingCampaigns } from '@/services/admin';
import { approveCampaign, rejectCampaign } from '@/services/admin-writes';

export function AdminCampaignApprovals() {
  const [adminPendingCampaigns, setAdminPendingCampaigns] = useState(mockPendingCampaigns);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => fetchAdminPendingCampaigns().then(setAdminPendingCampaigns);
  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string, name: string) => {
    setBusy(id);
    try { await approveCampaign(id, name); await load(); }
    catch (e) { alert(`Approve failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };
  const handleReject = async (id: string, name: string) => {
    setBusy(id);
    try { await rejectCampaign(id, name); await load(); }
    catch (e) { alert(`Reject failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-white">Pending Approvals</h3>
        <span className="px-2 py-0.5 rounded-full bg-vgold/20 text-vgold text-[10px] font-bold">
          {adminPendingCampaigns.length} waiting
        </span>
      </div>

      <div className="space-y-3">
        {adminPendingCampaigns.map((c) => (
          <div key={c.id} className="p-4 rounded-xl glass">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-vgold font-bold uppercase tracking-wider">{c.sponsor}</div>
                <h4 className="text-sm font-bold text-white mt-0.5">{c.name}</h4>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-vmuted">
                  <span className="flex items-center gap-1">
                    <IndianRupee size={11} /> Budget: ₹{c.budget.toLocaleString('en-IN')}
                  </span>
                  <span>Submitted: {c.submitted}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(c.id, c.name)}
                  disabled={busy === c.id}
                  className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 hover:bg-green-500/30 transition disabled:opacity-50"
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={() => handleReject(c.id, c.name)}
                  disabled={busy === c.id}
                  className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 active:scale-95 hover:bg-red-500/30 transition disabled:opacity-50"
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recently processed */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-white mb-3">Recently Processed</h3>
        <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
          {[
            { name: 'Nilgiri Tea Summer Push', sponsor: 'Tamil Tea Co.', action: 'Approved', time: '2h ago' },
            { name: 'A2B Festive Thali', sponsor: 'A2B Foods', action: 'Approved', time: '5h ago' },
            { name: 'Spam Ads Promo', sponsor: 'Spam Ads Inc.', action: 'Rejected', time: '1d ago' },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3.5">
              <div>
                <div className="text-sm font-semibold text-white">{c.name}</div>
                <div className="text-[11px] text-vmuted">{c.sponsor}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold ${c.action === 'Approved' ? 'text-green-400' : 'text-red-400'}`}>
                  {c.action}
                </span>
                <span className="text-[10px] text-vmuted">{c.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
