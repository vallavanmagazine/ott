import { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { adminSponsors as mockAdminSponsors } from '@/data/mockData';
import { fetchAdminSponsors } from '@/services/admin';

export function AdminSponsors() {
  const [adminSponsors, setAdminSponsors] = useState(mockAdminSponsors);

  useEffect(() => {
    fetchAdminSponsors().then(setAdminSponsors);
  }, []);

  const statusColors: Record<string, string> = {
    Active: 'text-green-400 bg-green-500/15',
    Pending: 'text-vgold bg-vgold/15',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-white">34</div>
          <div className="text-[10px] text-vmuted">Total Sponsors</div>
        </div>
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-green-400">28</div>
          <div className="text-[10px] text-vmuted">Active</div>
        </div>
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-vgold">₹6.2L</div>
          <div className="text-[10px] text-vmuted">Total Spend</div>
        </div>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">Sponsor</th>
              <th className="text-left px-4 py-3 font-bold">Campaigns</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Spend</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Joined</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {adminSponsors.map((s) => (
              <tr key={s.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                <td className="px-4 py-3 text-vmuted">{s.campaigns}</td>
                <td className="px-4 py-3 text-vgold font-bold hidden sm:table-cell">₹{s.spend.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vmuted hidden md:table-cell">{s.joined}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10">
                    <MoreVertical size={14} className="text-vmuted" />
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
