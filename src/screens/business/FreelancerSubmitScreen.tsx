import { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { fetchMyAssignments, submitTaskContent, type FreelancerAssignment } from '@/services/freelancer';

export function FreelancerSubmitScreen({ onBack }: { onBack: () => void }) {
  const [assignments, setAssignments] = useState<FreelancerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<FreelancerAssignment | null>(null);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetchMyAssignments().then((a) => { setAssignments(a); setLoading(false); });
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!active) return;
    setError(null);
    if (!url.trim()) { setError('Provide a content URL (upload link, drive, YouTube, etc.).'); return; }
    setBusy(true);
    try {
      await submitTaskContent(active.id, url.trim(), notes.trim() || undefined);
      setActive(null); setUrl(''); setNotes(''); load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const badge = (s: string) => s === 'approved' ? 'bg-green-500/15 text-green-400' : s === 'submitted' ? 'bg-blue-500/15 text-blue-400' : s === 'paid' ? 'bg-vgold/15 text-vgold' : 'bg-white/10 text-vmuted';

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Submit Content" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">My Assignments</h3>
        {loading ? (
          <div className="p-6 rounded-card glass text-center text-sm text-vmuted">Loading…</div>
        ) : assignments.length === 0 ? (
          <div className="p-6 rounded-card glass text-center text-sm text-vmuted">No assignments yet. Accept a task from your dashboard to begin.</div>
        ) : (
          <div className="space-y-2.5">
            {assignments.map((a) => (
              <div key={a.id} className="p-3.5 rounded-card glass">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{a.taskTitle}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${badge(a.status)}`}>{a.status}</span>
                </div>
                <div className="text-[11px] text-vmuted mt-1">{a.role} · ₹{a.payRupees.toLocaleString('en-IN')}</div>
                {a.contentUrl && <div className="text-[11px] text-blue-400 mt-1 truncate">{a.contentUrl}</div>}
                {(a.status === 'assigned' || a.status === 'rejected') && (
                  <button onClick={() => { setActive(a); setUrl(''); setNotes(''); setError(null); }} className="mt-2 px-3 py-1.5 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5"><Upload size={13} /> Submit Content</button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </div>

      {active && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">Submit: {active.taskTitle}</h3>
              <button onClick={() => setActive(null)} className="w-8 h-8 flex items-center justify-center rounded-full glass"><X size={16} className="text-white" /></button>
            </div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Content URL</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="w-full mt-1 mb-3 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none resize-none" />
            {error && <p className="text-[11px] text-vred mt-2">{error}</p>}
            <button onClick={submit} disabled={busy} className="w-full mt-3 py-3 rounded-full bg-vred text-white font-bold text-sm disabled:opacity-50">{busy ? 'Submitting…' : 'Submit for Review'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
