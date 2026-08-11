import { useState } from 'react';
import { Search, MoreVertical, Filter } from 'lucide-react';
import { adminUsers } from '@/data/mockData';

export function AdminUsers() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  const filtered = adminUsers.filter((u) => {
    const matchesQuery = u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  const statusColors: Record<string, string> = {
    Active: 'text-green-400 bg-green-500/15',
    Suspended: 'text-red-400 bg-red-500/15',
    Pending: 'text-vgold bg-vgold/15',
  };

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl glass">
          <Search size={16} className="text-vmuted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or email..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-vmuted outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-vmuted" />
        {['All', 'Viewer', 'Sponsor', 'Creator'].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              roleFilter === r ? 'bg-vred text-white' : 'glass text-vmuted'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">Name</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-bold">Role</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Joined</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                <td className="px-4 py-3 text-vmuted hidden sm:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-white/80">{u.role}</span>
                </td>
                <td className="px-4 py-3 text-vmuted hidden md:table-cell">{u.joined}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[u.status]}`}>
                    {u.status}
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

      <p className="text-xs text-vmuted">{filtered.length} users</p>
    </div>
  );
}
