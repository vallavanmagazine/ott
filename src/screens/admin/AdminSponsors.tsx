import { useState, useEffect } from 'react';
import { Ban, CheckCircle2 } from 'lucide-react';
import { adminSponsors as mockAdminSponsors } from '@/data/mockData';
import { fetchAdminSponsors } from '@/services/admin';
import { setSponsorStatus } from '@/services/admin-writes';

export function AdminSponsors() {
  const [adminSponsors, setAdminSponsors] = useState(mockAdminSponsors);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => fetchAdminSponsors().then(setAdminSponsors);
  useEffect(() => { load(); }, []);

  const statusColors: Record<string, string> = {
    Active: 'text-green-400 bg-green-500/15',
    Pending: 'text-vgold bg-vgold/15',
    Suspended: 'text-red-400 bg-red-500/15',
  };

  const total = adminSponsors.length;
  const active = adminSponsors.filter((s) => s.status === 'Active').length;
  const totalSpend = adminSponsors.reduce((sum, s) => sum + (s.spend ?? 0), 0);
  const spendLabel = totalSpend >= 100000 ? `₹${(totalSpend / 100000).toFixed(1)}L` : `₹${totalSpend.toLocaleString('en-IN')}`;

  const toggle = async (s: any) => {
    const next = s.status === 'Suspended' ? 'Active' : 'Suspended';
    setBusy(s.id);
    try { await setSponsorStatus(s.id, next, s.name); await load(); }
    catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-white">{total}</div>
          <div className="text-[10px] text-vmuted">Total Sponsors</div>
        </div>
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-green-400">{active}</div>
          <div className="text-[10px] text-vmuted">Active</div>
        </div>
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-vgold">{spendLabel}</div>
          <div className="text-[10px] text-vmuted">Total Spend</div>
        </div>
      </div>

      <div className="rounded-xl glass overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">Sponsor</th>
              <th className="text-left px-4 py-3 font-bold">Campaigns</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Spend</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Joined</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 text-left font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {adminSponsors.map((s: any) => (
              <tr key={s.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                <td className="px-4 py-3 text-vmuted">{s.campaigns}</td>
                <td className="px-4 py-3 text-vgold font-bold hidden sm:table-cell">₹{s.spend.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vmuted hidden md:table-cell">{s.joined}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[s.status] ?? 'text-vmuted bg-white/10'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(s)} disabled={busy === s.id} title={s.status === 'Suspended' ? 'Activate' : 'Suspend'}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50 ${s.status === 'Suspended' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                    {s.status === 'Suspended' ? <><CheckCircle2 size={13} /> Activate</> : <><Ban size={13} /> Suspend</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
