import { useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Pencil, Check, X } from 'lucide-react';
import {
  fetchAllCategories, addCategory, renameCategory, setCategoryActive, moveCategory, deleteCategory,
  type CategorySection, type ContentCategory,
} from '@/services/categories';

const SECTIONS: { key: CategorySection; label: string }[] = [
  { key: 'explore', label: 'Explore' },
  { key: 'inspire', label: 'Inspire' },
  { key: 'feed', label: 'Feed' },
];

export function AdminCategories() {
  const [section, setSection] = useState<CategorySection>('explore');
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [adding, setAdding] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => fetchAllCategories(section).then(setCats);
  useEffect(() => { load(); }, [section]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); await load(); }
    catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setBusy(false); }
  };

  const add = () => { if (adding.trim()) run(async () => { await addCategory(section, adding); setAdding(''); }); };
  const swap = (i: number, j: number) => {
    if (j < 0 || j >= cats.length) return;
    run(async () => { await moveCategory(cats[i].id, cats[j].sortOrder); await moveCategory(cats[j].id, cats[i].sortOrder); });
  };
  const remove = (c: ContentCategory) => { if (confirm(`Delete "${c.displayName}"? Content in this category keeps its label but the chip disappears. Consider hiding instead.`)) run(() => deleteCategory(c.id)); };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        {SECTIONS.map((s) => (
          <button key={s.key} onClick={() => setSection(s.key)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${section === s.key ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{s.label}</button>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={adding} onChange={(e) => setAdding(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder={`New ${section} category…`} className="flex-1 px-3 py-2.5 rounded-lg glass text-sm text-white outline-none" />
        <button onClick={add} disabled={busy || !adding.trim()} className="px-3 py-2.5 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"><Plus size={14} /> Add</button>
      </div>

      <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
        {cats.map((c, i) => (
          <div key={c.id} className={`flex items-center gap-2 px-3 py-2.5 ${c.isActive ? '' : 'opacity-50'}`}>
            <div className="flex flex-col">
              <button onClick={() => swap(i, i - 1)} disabled={i === 0} className="text-vmuted disabled:opacity-30"><ArrowUp size={13} /></button>
              <button onClick={() => swap(i, i + 1)} disabled={i === cats.length - 1} className="text-vmuted disabled:opacity-30"><ArrowDown size={13} /></button>
            </div>
            {editId === c.id ? (
              <>
                <input value={editVal} onChange={(e) => setEditVal(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg glass text-sm text-white outline-none" />
                <button onClick={() => run(async () => { await renameCategory(c.id, editVal); setEditId(null); })} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/15 text-green-400"><Check size={14} /></button>
                <button onClick={() => setEditId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg glass text-vmuted"><X size={14} /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-semibold text-white">{c.displayName}</span>
                <button onClick={() => { setEditId(c.id); setEditVal(c.displayName); }} className="w-7 h-7 flex items-center justify-center rounded-lg glass text-vmuted" title="Rename"><Pencil size={13} /></button>
                <button onClick={() => run(() => setCategoryActive(c.id, !c.isActive))} className="w-7 h-7 flex items-center justify-center rounded-lg glass text-vmuted" title={c.isActive ? 'Hide' : 'Show'}>{c.isActive ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                <button onClick={() => remove(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400" title="Delete"><Trash2 size={13} /></button>
              </>
            )}
          </div>
        ))}
        {cats.length === 0 && <div className="px-4 py-8 text-center text-sm text-vmuted">No categories — add one above.</div>}
      </div>
      <p className="text-[10px] text-vmuted">Run <span className="font-mono">supabase/fix_categories_roles.sql</span> to create the content_categories table.</p>
    </div>
  );
}
