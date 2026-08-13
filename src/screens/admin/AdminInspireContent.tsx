import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { fetchInspireItems } from '@/services/inspire';
import { createInspireItem, updateInspireItem, deleteInspireItem, type InspireItemInput } from '@/services/admin-writes';
import { pexelsUrl, type InspireItem } from '@/data/mockData';
import { DyneTubeUpload } from '@/components/DyneTubeUpload';

const CATEGORIES = ['Motivation', 'Success Stories', 'Life Lessons', 'Changemakers', 'Youth Voices'];

interface Form {
  title: string; titleTa: string; category: string; durationSec: number;
  poster: string; videoUrl: string; quote: string; attribution: string; badge: string;
}
const EMPTY: Form = { title: '', titleTa: '', category: 'Motivation', durationSec: 180, poster: '', videoUrl: '', quote: '', attribution: '', badge: '' };

function parseDuration(d: string): number {
  const m = d.match(/(\d+):(\d+)/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 180;
}

export function AdminInspireContent() {
  const [items, setItems] = useState<InspireItem[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null);

  const load = () => fetchInspireItems().then(setItems);
  useEffect(() => { load(); }, []);

  const openEdit = (it: InspireItem) => setEditing({
    id: it.id,
    form: { title: it.title, titleTa: it.titleTa, category: it.category, durationSec: parseDuration(it.duration), poster: it.poster, videoUrl: it.videoUrl ?? '', quote: it.quote ?? '', attribution: it.attribution ?? '', badge: it.badge ?? '' },
  });

  const del = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setBusy(id);
    try { await deleteInspireItem(id, title); await load(); }
    catch (e) { alert(`Delete failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!f.title.trim()) { alert('Title required'); return; }
    const input: InspireItemInput = {
      title: f.title.trim(), titleTa: f.titleTa.trim() || f.title.trim(), category: f.category,
      durationSec: Number(f.durationSec) || 180, poster: f.poster.trim() || '16983197',
      videoUrl: f.videoUrl.trim() || null, quote: f.quote.trim() || null,
      attribution: f.attribution.trim() || null, badge: f.badge.trim() || null,
    };
    setBusy('save');
    try {
      if (editing.id) await updateInspireItem(editing.id, input);
      else await createInspireItem(input);
      setEditing(null);
      await load();
    } catch (e) { alert(`Save failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const inp = 'w-full px-3 py-2.5 rounded-lg glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Inspire Content</h3>
        <button onClick={() => setEditing({ id: null, form: { ...EMPTY } })} className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95"><Plus size={16} /> Add New</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
          <div key={it.id} className="p-3 rounded-xl glass">
            <div className="flex gap-3">
              <img src={pexelsUrl(it.poster, 150)} alt={it.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{it.title}</div>
                <div className="text-[11px] text-vmuted">{it.category} · {it.duration}</div>
                {it.videoUrl && <div className="text-[9px] text-green-400 mt-0.5">▶ video</div>}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => openEdit(it)} className="flex-1 py-1.5 rounded-lg glass text-white text-[11px] font-bold flex items-center justify-center gap-1"><Pencil size={12} /> Edit</button>
              <button onClick={() => del(it.id, it.title)} disabled={busy === it.id} className="flex-1 py-1.5 rounded-lg glass text-vmuted hover:text-red-400 text-[11px] font-bold flex items-center justify-center gap-1 disabled:opacity-50"><Trash2 size={12} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">{editing.id ? 'Edit' : 'Add'} Inspire Item</h3>
              <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-full glass"><X size={16} className="text-white" /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <input value={editing.form.title} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, title: e.target.value } })} placeholder="Title (English)" className={inp} />
              <input value={editing.form.titleTa} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, titleTa: e.target.value } })} placeholder="தலைப்பு" className={`${inp} font-tamil`} />
              <div className="grid grid-cols-2 gap-3">
                <select value={editing.form.category} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, category: e.target.value } })} className={inp}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                <input type="number" value={editing.form.durationSec} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, durationSec: Number(e.target.value) } })} placeholder="Duration (sec)" className={inp} />
              </div>
              <input value={editing.form.poster} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, poster: e.target.value } })} placeholder="Poster URL / Pexels id" className={inp} />
              <input value={editing.form.videoUrl} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, videoUrl: e.target.value } })} placeholder="Video URL (YouTube / HLS / MP4)" className={inp} />
              <DyneTubeUpload onUploaded={(url) => setEditing((ed) => ed && ({ ...ed, form: { ...ed.form, videoUrl: url } }))} />
              <textarea value={editing.form.quote} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, quote: e.target.value } })} placeholder="Quote (optional)" rows={2} className={`${inp} resize-none`} />
              <div className="grid grid-cols-2 gap-3">
                <input value={editing.form.attribution} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, attribution: e.target.value } })} placeholder="Attribution" className={inp} />
                <select value={editing.form.badge} onChange={(e) => setEditing({ ...editing, form: { ...editing.form, badge: e.target.value } })} className={inp}><option value="">No badge</option><option value="FEATURED">FEATURED</option></select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-full glass text-white font-bold text-sm">Cancel</button>
              <button onClick={save} disabled={busy === 'save'} className="flex-1 py-3 rounded-full bg-vred text-white font-bold text-sm disabled:opacity-50">{busy === 'save' ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
