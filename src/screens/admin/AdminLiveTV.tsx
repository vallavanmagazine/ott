import { useState, useEffect } from 'react';
import { Plus, Tv, Trash2, X } from 'lucide-react';
import { liveSchedule as mockSchedule } from '@/data/mockData';
import { fetchLiveSchedule } from '@/services/live';
import { createLiveSlot, deleteLiveSlot } from '@/services/admin-writes';

export function AdminLiveTV() {
  const [liveSchedule, setLiveSchedule] = useState(mockSchedule);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', titleTa: '', description: '', startTime24: '18:00', durationMin: 30, videoUrl: '', isLive: false, airDate: new Date().toISOString().slice(0, 10) });

  const load = () => fetchLiveSchedule().then(setLiveSchedule);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete slot "${title}"?`)) return;
    setBusy(id);
    try { await deleteLiveSlot(id, title); await load(); }
    catch (e) { alert(`Delete failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    setBusy('new');
    try {
      await createLiveSlot({
        title: form.title.trim(),
        titleTa: form.titleTa.trim() || form.title.trim(),
        description: form.description.trim(),
        thumb: '30004134',
        startTime24: form.startTime24,
        durationMin: Number(form.durationMin) || 30,
        videoUrl: form.videoUrl.trim() || null,
        isLive: form.isLive,
        airDate: form.airDate,
        sortOrder: liveSchedule.length,
      });
      setForm({ title: '', titleTa: '', description: '', startTime24: '18:00', durationMin: 30, videoUrl: '', isLive: false, airDate: new Date().toISOString().slice(0, 10) });
      setShowAdd(false);
      await load();
    } catch (e) { alert(`Create failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      {/* Channel info */}
      <div className="p-4 rounded-xl glass flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-vred flex items-center justify-center">
          <Tv size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-black text-white">VALLAVAN TV</h3>
          <p className="text-xs text-vmuted">Live 24/7 · 1,240 watching now</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-bold">On Air</span>
      </div>

      {/* Schedule editor */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Today's Program Schedule</h3>
        <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
          <Plus size={14} /> Add Slot
        </button>
      </div>

      <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
        {liveSchedule.map((slot) => (
          <div key={slot.id} className="flex items-center gap-4 p-3.5 hover:bg-white/5 transition">
            <div className="w-20 text-center">
              <div className="text-sm font-bold text-white">{slot.time}</div>
              <div className="text-[10px] text-vmuted">{slot.duration}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{slot.title}</div>
              <div className="text-[11px] font-tamil text-vmuted truncate">{slot.titleTa}</div>
            </div>
            {slot.isLive && (
              <span className="px-2 py-0.5 rounded-full bg-vred text-white text-[10px] font-bold">LIVE</span>
            )}
            <button
              onClick={() => handleDelete(slot.id, slot.title)}
              disabled={busy === slot.id}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-vmuted hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">Add Program Slot</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full glass">
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Program title (English)" className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
              <input value={form.titleTa} onChange={(e) => setForm({ ...form, titleTa: e.target.value })} placeholder="தலைப்பு (Tamil)" className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred font-tamil" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Start (24h)</label>
                  <input type="time" value={form.startTime24} onChange={(e) => setForm({ ...form, startTime24: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Duration (min)</label>
                  <input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
                </div>
              </div>
              <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="Streaming/Video URL (HLS .m3u8 / YouTube / MP4)" className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Air Date</label>
                  <input type="date" value={form.airDate} onChange={(e) => setForm({ ...form, airDate: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
                </div>
                <button onClick={() => setForm({ ...form, isLive: !form.isLive })} className="flex items-center justify-between px-4 py-3 rounded-xl glass">
                  <span className="text-sm font-semibold text-white">Live now</span>
                  <div className={`w-11 h-6 rounded-full p-0.5 transition ${form.isLive ? 'bg-vred' : 'bg-white/15'}`}><div className={`w-5 h-5 rounded-full bg-white transition ${form.isLive ? 'translate-x-5' : ''}`} /></div>
                </button>
              </div>
              <button onClick={handleCreate} disabled={busy === 'new'} className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
                {busy === 'new' ? 'Saving…' : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
