import { useState, useEffect } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { fetchApplications, setFreelancerStatus, createTask, FREELANCER_ROLES } from '@/services/freelancer';

export function AdminFreelancers() {
  const [apps, setApps] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [showTask, setShowTask] = useState(false);
  const [task, setTask] = useState({ title: '', description: '', contentType: 'FEED', roles: [] as string[], location: '', pay: 3000 });

  const load = () => fetchApplications().then(setApps);
  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: string, name: string) => {
    setBusy(id);
    try { await setFreelancerStatus(id, status, name); await load(); }
    catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const saveTask = async () => {
    if (!task.title.trim() || task.roles.length === 0) { alert('Title and at least one role required'); return; }
    setBusy('task');
    try {
      await createTask({ title: task.title, description: task.description, contentType: task.contentType, rolesNeeded: task.roles, payPerRole: Object.fromEntries(task.roles.map((r) => [r, task.pay])), location: task.location });
      setShowTask(false); setTask({ title: '', description: '', contentType: 'FEED', roles: [], location: '', pay: 3000 });
    } catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const statusColor = (s: string) => s === 'approved' ? 'text-green-400 bg-green-500/15' : s === 'rejected' ? 'text-red-400 bg-red-500/15' : 'text-vgold bg-vgold/15';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Freelancer Applications</h3>
        <button onClick={() => setShowTask(true)} className="px-3 py-1.5 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5"><Plus size={14} /> Create Task</button>
      </div>

      <div className="rounded-xl glass overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
            <th className="text-left px-4 py-3 font-bold">Name</th><th className="text-left px-4 py-3 font-bold">Roles</th>
            <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">District</th><th className="text-left px-4 py-3 font-bold">Status</th><th className="text-left px-4 py-3 font-bold">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {apps.map((a) => (
              <tr key={a.id} className="hover:bg-white/5">
                <td className="px-4 py-3"><div className="font-semibold text-white">{a.name}</div><div className="text-[10px] text-vmuted">{a.email}</div></td>
                <td className="px-4 py-3 text-vmuted text-xs">{(a.roles ?? []).join(', ')}</td>
                <td className="px-4 py-3 text-vmuted hidden sm:table-cell">{a.district ?? '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(a.status)}`}>{a.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => decide(a.id, 'approved', a.name)} disabled={busy === a.id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/15 text-green-400 disabled:opacity-50"><Check size={14} /></button>
                    <button onClick={() => decide(a.id, 'rejected', a.name)} disabled={busy === a.id} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400 disabled:opacity-50"><X size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {apps.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-vmuted text-sm">No applications yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showTask && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4"><h3 className="text-base font-black text-white">Create Task</h3><button onClick={() => setShowTask(false)} className="w-8 h-8 flex items-center justify-center rounded-full glass"><X size={16} className="text-white" /></button></div>
            <div className="space-y-3">
              <input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} placeholder="Task title" className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none" />
              <textarea value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={task.contentType} onChange={(e) => setTask({ ...task, contentType: e.target.value })} className="px-3 py-2.5 rounded-lg glass text-sm text-white outline-none"><option>FEED</option><option>EXPLORE</option><option>INSPIRE</option></select>
                <input type="number" value={task.pay} onChange={(e) => setTask({ ...task, pay: Number(e.target.value) })} placeholder="Pay/role ₹" className="px-3 py-2.5 rounded-lg glass text-sm text-white outline-none" />
              </div>
              <div className="flex flex-wrap gap-2">
                {FREELANCER_ROLES.map((r) => <button key={r} onClick={() => setTask((t) => ({ ...t, roles: t.roles.includes(r) ? t.roles.filter((x) => x !== r) : [...t.roles, r] }))} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${task.roles.includes(r) ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{r}</button>)}
              </div>
              <input value={task.location} onChange={(e) => setTask({ ...task, location: e.target.value })} placeholder="Location" className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none" />
              <button onClick={saveTask} disabled={busy === 'task'} className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm disabled:opacity-50">{busy === 'task' ? 'Saving…' : 'Create Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
