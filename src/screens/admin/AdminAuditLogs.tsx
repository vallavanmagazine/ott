import { useState, useEffect } from 'react';
import { adminAuditLogs as mockAuditLogs } from '@/data/mockData';
import { fetchAdminAuditLogs } from '@/services/admin';

export function AdminAuditLogs() {
  const [adminAuditLogs, setAdminAuditLogs] = useState(mockAuditLogs);

  useEffect(() => {
    fetchAdminAuditLogs().then(setAdminAuditLogs);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Activity Log</h3>
        <button className="px-3 py-1.5 rounded-lg glass text-white text-xs font-bold active:scale-95">
          Export Logs
        </button>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">User</th>
              <th className="text-left px-4 py-3 font-bold">Action</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {adminAuditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white text-xs">{log.user}</td>
                <td className="px-4 py-3 text-white/90">{log.action}</td>
                <td className="px-4 py-3 text-vmuted hidden sm:table-cell text-xs">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-vmuted">Showing last 5 entries · {adminAuditLogs.length} total</p>
    </div>
  );
}
