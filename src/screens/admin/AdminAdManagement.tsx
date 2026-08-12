import { useState, useEffect } from 'react';
import { adminAdPlacements as mockAdPlacements } from '@/data/mockData';
import { fetchAdminAdPlacements } from '@/services/admin';

export function AdminAdManagement() {
  const [adminAdPlacements, setAdminAdPlacements] = useState(mockAdPlacements);

  useEffect(() => {
    fetchAdminAdPlacements().then(setAdminAdPlacements);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-white">5</div>
          <div className="text-[10px] text-vmuted">Live Placements</div>
        </div>
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-vgold">190K</div>
          <div className="text-[10px] text-vmuted">Total Impressions</div>
        </div>
        <div className="p-3.5 rounded-xl glass">
          <div className="text-xl font-black text-green-400">4</div>
          <div className="text-[10px] text-vmuted">Active Sponsors</div>
        </div>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">Sponsor</th>
              <th className="text-left px-4 py-3 font-bold">Placement</th>
              <th className="text-left px-4 py-3 font-bold">Impressions</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {adminAdPlacements.map((a) => (
              <tr key={a.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white">{a.sponsor}</td>
                <td className="px-4 py-3 text-vmuted">{a.placement}</td>
                <td className="px-4 py-3 text-vgold font-bold">{a.impressions.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 text-[10px] font-bold">
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
