import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Pencil, X } from 'lucide-react';
import { adminDocumentaries as mockAdminDocs } from '@/data/mockData';
import { fetchAdminDocumentaries } from '@/services/admin';
import { fetchDocumentaryById } from '@/services/documentaries';
import { DyneTubeUpload } from '@/components/DyneTubeUpload';
import {
  createDocumentary, updateDocumentary, deleteDocumentary,
  publishDocumentary, unpublishDocumentary, type DocumentaryInput,
} from '@/services/admin-writes';

const GENRES = [
  'Environment', 'Wildlife', 'History', 'Science', 'Society', 'Investigation',
  'Education', 'Culture', 'Motivation', 'Success Stories', 'Life Lessons',
  'Changemakers', 'Youth Voices',
];

const EMPTY: DocForm = {
  title: '', titleTa: '', genre: 'Environment', durationSec: 0, poster: '', backdrop: '',
  videoUrl: '', year: new Date().getFullYear(), language: 'Tamil', synopsis: '', synopsisTa: '',
  badge: '', director: '', cast: '', status: 'Draft',
};

interface DocForm {
  title: string; titleTa: string; genre: string; durationSec: number;
  poster: string; backdrop: string; videoUrl: string; year: number; language: string;
  synopsis: string; synopsisTa: string; badge: string; director: string; cast: string;
  status: 'Published' | 'Draft';
}

export function AdminDocumentaries() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(mockAdminDocs);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string | null; form: DocForm } | null>(null);

  const load = () => fetchAdminDocumentaries().then(setRows);
  useEffect(() => { load(); }, []);

  const statusColors: Record<string, string> = { Published: 'text-green-400 bg-green-500/15', Draft: 'text-vgold bg-vgold/15' };
  const filtered = rows.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));

  const openAdd = () => setEditing({ id: null, form: { ...EMPTY } });

  const openEdit = async (id: string) => {
    setBusy(id);
    const doc = await fetchDocumentaryById(id);
    setBusy(null);
    if (!doc) { alert('Could not load this documentary.'); return; }
    setEditing({
      id,
      form: {
        title: doc.title, titleTa: doc.titleTa, genre: doc.genre, durationSec: doc.durationSec,
        poster: doc.poster, backdrop: doc.backdrop, videoUrl: doc.videoUrl ?? '', year: doc.year,
        language: doc.language, synopsis: doc.synopsis, synopsisTa: doc.synopsisTa,
        badge: doc.badge ?? '', director: doc.director ?? '', cast: (doc.cast ?? []).join(', '),
        status: (doc.badge === undefined ? 'Draft' : 'Published') as 'Published' | 'Draft',
      },
    });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    try { await deleteDocumentary(id, title); await load(); }
    catch (e) { alert(`Delete failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const togglePublish = async (id: string, title: string, status: string) => {
    setBusy(id);
    try { status === 'Published' ? await unpublishDocumentary(id, title) : await publishDocumentary(id, title); await load(); }
    catch (e) { alert(`Action failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  const save = async () => {
    if (!editing) return;
    const f = editing.form;
    if (!f.title.trim()) { alert('Title is required'); return; }
    const input: DocumentaryInput = {
      title: f.title.trim(), titleTa: f.titleTa.trim() || f.title.trim(), genre: f.genre,
      durationSec: Number(f.durationSec) || 0, poster: f.poster.trim() || '30004134',
      backdrop: f.backdrop.trim() || f.poster.trim() || '30004134',
      videoUrl: f.videoUrl.trim() || null, year: Number(f.year) || new Date().getFullYear(),
      language: f.language.trim() || 'Tamil', synopsis: f.synopsis.trim(), synopsisTa: f.synopsisTa.trim(),
      badge: f.badge.trim() || null, director: f.director.trim() || null,
      cast: f.cast.trim() ? f.cast.split(',').map((c) => c.trim()).filter(Boolean) : null,
      status: f.status,
    };
    setBusy('save');
    try {
      if (editing.id) await updateDocumentary(editing.id, input);
      else await createDocumentary(input);
      setEditing(null);
      await load();
    } catch (e) { alert(`Save failed: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl glass">
          <Search size={16} className="text-vmuted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documentaries..." className="flex-1 bg-transparent text-sm text-white placeholder:text-vmuted outline-none" />
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95"><Plus size={16} /> Add New</button>
      </div>

      <div className="rounded-xl glass overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">Title</th>
              <th className="text-left px-4 py-3 font-bold">Genre</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Views</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Uploaded</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="text-left px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white">{d.title}</td>
                <td className="px-4 py-3 text-vmuted">{d.genre}</td>
                <td className="px-4 py-3 text-vmuted hidden sm:table-cell">{d.views.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vmuted hidden md:table-cell">{d.uploaded}</td>
                <td className="px-4 py-3">
                  <button onClick={() => togglePublish(d.id, d.title, d.status)} disabled={busy === d.id} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[d.status]} disabled:opacity-50`}>{d.status}</button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(d.id)} disabled={busy === d.id} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-vmuted hover:text-white disabled:opacity-50"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(d.id, d.title)} disabled={busy === d.id} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-vmuted hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <DocFormModal
          form={editing.form}
          isEdit={!!editing.id}
          saving={busy === 'save'}
          onChange={(patch) => setEditing((e) => e && ({ ...e, form: { ...e.form, ...patch } }))}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function DocFormModal({ form, isEdit, saving, onChange, onClose, onSave }: {
  form: DocForm; isEdit: boolean; saving: boolean;
  onChange: (patch: Partial<DocForm>) => void; onClose: () => void; onSave: () => void;
}) {
  const inp = 'w-full px-3 py-2.5 rounded-lg glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred';
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">{isEdit ? 'Edit Documentary' : 'Add New Documentary'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full glass"><X size={16} className="text-white" /></button>
        </div>
        <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Title (English)"><input value={form.title} onChange={(e) => onChange({ title: e.target.value })} className={inp} /></Field>
            <Field label="தலைப்பு (Tamil)"><input value={form.titleTa} onChange={(e) => onChange({ titleTa: e.target.value })} className={`${inp} font-tamil`} /></Field>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Genre"><select value={form.genre} onChange={(e) => onChange({ genre: e.target.value })} className={inp}>{GENRES.map((g) => <option key={g} value={g}>{g}</option>)}</select></Field>
            <Field label="Duration (sec)"><input type="number" value={form.durationSec} onChange={(e) => onChange({ durationSec: Number(e.target.value) })} className={inp} /></Field>
            <Field label="Year"><input type="number" value={form.year} onChange={(e) => onChange({ year: Number(e.target.value) })} className={inp} /></Field>
          </div>
          <Field label="Video URL (YouTube / HLS .m3u8 / MP4) — paste, or upload below">
            <input value={form.videoUrl} onChange={(e) => onChange({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/embed/…" className={inp} />
            <div className="mt-2"><DyneTubeUpload onUploaded={(url) => onChange({ videoUrl: url })} /></div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Poster URL / Pexels id"><input value={form.poster} onChange={(e) => onChange({ poster: e.target.value })} className={inp} /></Field>
            <Field label="Backdrop URL / Pexels id"><input value={form.backdrop} onChange={(e) => onChange({ backdrop: e.target.value })} className={inp} /></Field>
          </div>
          <Field label="Synopsis (English)"><textarea value={form.synopsis} onChange={(e) => onChange({ synopsis: e.target.value })} rows={2} className={`${inp} resize-none`} /></Field>
          <Field label="சுருக்கம் (Tamil)"><textarea value={form.synopsisTa} onChange={(e) => onChange({ synopsisTa: e.target.value })} rows={2} className={`${inp} resize-none font-tamil`} /></Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Language"><input value={form.language} onChange={(e) => onChange({ language: e.target.value })} className={inp} /></Field>
            <Field label="Badge"><select value={form.badge} onChange={(e) => onChange({ badge: e.target.value })} className={inp}><option value="">None</option><option value="FEATURED">FEATURED</option><option value="NEW">NEW</option></select></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => onChange({ status: e.target.value as 'Published' | 'Draft' })} className={inp}><option>Draft</option><option>Published</option></select></Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Director"><input value={form.director} onChange={(e) => onChange({ director: e.target.value })} className={inp} /></Field>
            <Field label="Cast (comma-separated)"><input value={form.cast} onChange={(e) => onChange({ cast: e.target.value })} className={inp} /></Field>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-full glass text-white font-bold text-sm active:scale-95">Cancel</button>
          <button onClick={onSave} disabled={saving} className="flex-1 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
