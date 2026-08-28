/**
 * Audit Logs — the append-only record of every admin mutation.
 *
 * Rows are written by logAudit() in services/admin-writes.ts, which runs after
 * each successful write. Nothing here mutates: this screen is read, filter and
 * export only, which is the point of an audit trail.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ScrollText, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateShort } from '@/lib/transforms';
import { useToast } from '@/components/admin/Toast';
import { downloadCsv, datedFilename } from '@/lib/csv';
import { SearchInput, StatCard, SkeletonTable, EmptyState } from '@/components/admin/ui';

interface AuditRow {
  id: string;
  actor: string;
  action: string;
  time: string;
  isoDate: string;
}

/** Coarse action category derived from the log text, for the filter dropdown. */
function categorise(action: string): string {
  const a = action.toLowerCase();
  if (a.startsWith('created') || a.startsWith('added')) return 'Create';
  if (a.startsWith('updated') || a.startsWith('renamed') || a.includes('→')) return 'Update';
  if (a.startsWith('deleted') || a.startsWith('removed')) return 'Delete';
  if (a.startsWith('approved') || a.startsWith('published')) return 'Approve';
  if (a.startsWith('rejected') || a.startsWith('unpublished') || a.startsWith('paused')) return 'Reject';
  if (a.includes('paid') || a.includes('released') || a.includes('payment') || a.includes('invoice')) return 'Payment';
  return 'Other';
}

export function AdminAuditLogs() {
  const toast = useToast();
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [actorFilter, setActorFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    if (!supabase) { setLogs([]); setLoading(false); return; }
    const { data } = await supabase
      .from('audit_logs')
      .select('id, actor, action, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    setLogs((data ?? []).map((r: any) => ({
      id: r.id,
      actor: r.actor,
      action: r.action,
      time: formatDateShort(r.created_at),
      isoDate: String(r.created_at).slice(0, 10),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const actors = useMemo(() => ['All', ...new Set(logs.map((l) => l.actor))], [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (q && !l.action.toLowerCase().includes(q) && !l.actor.toLowerCase().includes(q)) return false;
      if (actorFilter !== 'All' && l.actor !== actorFilter) return false;
      if (categoryFilter !== 'All' && categorise(l.action) !== categoryFilter) return false;
      if (fromDate && l.isoDate < fromDate) return false;
      if (toDate && l.isoDate > toDate) return false;
      return true;
    });
  }, [logs, query, actorFilter, categoryFilter, fromDate, toDate]);

  const exportLogs = () => {
    downloadCsv(
      datedFilename('vallavan-audit'),
      ['Time', 'Actor', 'Category', 'Action'],
      filtered.map((l) => [l.time, l.actor, categorise(l.action), l.action]),
    );
    toast.success(`Exported ${filtered.length} log entries`);
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = logs.filter((l) => l.isoDate === today).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Entries Loaded" value={logs.length} icon={<ScrollText size={13} />} />
        <StatCard label="Today" value={todayCount} accent="text-green-400" />
        <StatCard label="Distinct Actors" value={Math.max(0, actors.length - 1)} accent="text-blue-400" />
        <StatCard label="Showing" value={filtered.length} accent="text-vgold" />
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search actions or actors..." />
        <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none max-w-[220px]">
          {actors.map((a) => <option key={a} value={a}>{a === 'All' ? 'All Actors' : a}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
          {['All', 'Create', 'Update', 'Delete', 'Approve', 'Reject', 'Payment', 'Other'].map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Actions' : c}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs text-white outline-none" />
          <span className="text-vmuted text-xs">to</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs text-white outline-none" />
        </div>
        <button onClick={load} className="px-3 py-2.5 rounded-xl glass text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
          <RefreshCw size={13} /> Refresh
        </button>
        <button onClick={exportLogs} className="px-3 py-2.5 rounded-xl bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {loading ? <SkeletonTable rows={8} cols={3} /> : filtered.length === 0 ? (
        <EmptyState
          title={logs.length === 0 ? 'No audit entries yet' : 'Nothing matches those filters'}
          hint={logs.length === 0 ? 'Every admin action writes a row here automatically.' : undefined}
        />
      ) : (
        <div className="rounded-xl glass overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                <th className="text-left px-4 py-3 font-bold w-40">Time</th>
                <th className="text-left px-4 py-3 font-bold w-52">Actor</th>
                <th className="text-left px-4 py-3 font-bold w-24">Type</th>
                <th className="text-left px-4 py-3 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-vmuted text-xs whitespace-nowrap">{l.time}</td>
                  <td className="px-4 py-3 font-semibold text-white text-xs truncate">{l.actor}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold uppercase text-white/70">
                      {categorise(l.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/90">{l.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-vmuted">
        Showing {filtered.length} of {logs.length} loaded entries (most recent 500).
      </p>
    </div>
  );
}
