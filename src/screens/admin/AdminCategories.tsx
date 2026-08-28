import { useCallback, useState, useEffect } from 'react';
import { Plus, Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Pencil, Check, X } from 'lucide-react';
import {
  fetchAllCategories, addCategory, renameCategory, setCategoryActive, reorderCategories, deleteCategory,
  type CategorySection, type ContentCategory,
} from '@/services/categories';
import { useToast } from '@/components/admin/Toast';
import { ConfirmDialog, SkeletonTable } from '@/components/admin/ui';

const SECTIONS: { key: CategorySection; label: string }[] = [
  { key: 'explore', label: 'Explore' },
  { key: 'inspire', label: 'Inspire' },
  { key: 'feed', label: 'Feed' },
];

export function AdminCategories() {
  const toast = useToast();
  const [section, setSection] = useState<CategorySection>('explore');
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEn, setAddEn] = useState('');
  const [addTa, setAddTa] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editTa, setEditTa] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<ContentCategory | null>(null);

  const load = useCallback(async () => {
    setCats(await fetchAllCategories(section));
    setLoading(false);
  }, [section]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const run = async (fn: () => Promise<void>, okMessage?: string) => {
    setBusy(true);
    try {
      await fn();
      await load();
      if (okMessage) toast.success(okMessage);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const add = () => {
    if (!addEn.trim()) return;
    const name = addEn.trim();
    run(async () => { await addCategory(section, addEn, addTa); setAddEn(''); setAddTa(''); }, `Added "${name}"`);
  };
  const startEdit = (c: ContentCategory) => { setEditId(c.id); setEditEn(c.displayName); setEditTa(c.displayNameTa); };

  /** Move one row and rewrite the whole section's order by index. */
  const swap = (i: number, j: number) => {
    if (j < 0 || j >= cats.length) return;
    const next = [...cats];
    [next[i], next[j]] = [next[j], next[i]];
    setCats(next);
    run(() => reorderCategories(next.map((c) => c.id)));
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex gap-2">
        {SECTIONS.map((s) => (
          <button key={s.key} onClick={() => setSection(s.key)} className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${section === s.key ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{s.label}</button>
        ))}
      </div>

      {/* Add form */}
      <div className="p-3 rounded-xl glass grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
        <input value={addEn} onChange={(e) => setAddEn(e.target.value)} placeholder="English name" className="px-3 py-2.5 rounded-lg glass text-sm text-white outline-none" />
        <input value={addTa} onChange={(e) => setAddTa(e.target.value)} placeholder="Tamil name (பெயர்)" className="px-3 py-2.5 rounded-lg glass text-sm text-white outline-none font-tamil" />
        <button onClick={add} disabled={busy || !addEn.trim()} className="px-4 py-2.5 rounded-lg bg-vred text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"><Plus size={14} /> Add Category</button>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={5} cols={5} /> : (
      <div className="rounded-xl glass overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[620px]">
          <thead><tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
            <th className="px-3 py-3 w-10"></th>
            <th className="text-left px-3 py-3 font-bold">English</th>
            <th className="text-left px-3 py-3 font-bold">Tamil</th>
            <th className="text-left px-3 py-3 font-bold">Content</th>
            <th className="text-left px-3 py-3 font-bold">Status</th>
            <th className="text-left px-3 py-3 font-bold">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {cats.map((c, i) => (
              <tr key={c.id} className={`hover:bg-white/5 ${c.isActive ? '' : 'opacity-50'}`}>
                <td className="px-2 py-2">
                  <div className="flex flex-col">
                    <button onClick={() => swap(i, i - 1)} disabled={i === 0} className="text-vmuted disabled:opacity-30"><ArrowUp size={13} /></button>
                    <button onClick={() => swap(i, i + 1)} disabled={i === cats.length - 1} className="text-vmuted disabled:opacity-30"><ArrowDown size={13} /></button>
                  </div>
                </td>
                {editId === c.id ? (
                  <>
                    <td className="px-3 py-2"><input value={editEn} onChange={(e) => setEditEn(e.target.value)} className="w-full px-2 py-1.5 rounded-lg glass text-sm text-white outline-none" /></td>
                    <td className="px-3 py-2"><input value={editTa} onChange={(e) => setEditTa(e.target.value)} className="w-full px-2 py-1.5 rounded-lg glass text-sm text-white outline-none font-tamil" /></td>
                    <td className="px-3 py-2 text-vmuted">{c.contentCount ?? 0}</td>
                    <td className="px-3 py-2" colSpan={2}>
                      <div className="flex gap-1.5">
                        <button onClick={() => run(async () => { await renameCategory(c.id, editEn, editTa); setEditId(null); }, 'Category renamed')} className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-500/15 text-green-400"><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg glass text-vmuted"><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 font-semibold text-white">{c.displayName}</td>
                    <td className="px-3 py-2 text-white/90 font-tamil">{c.displayNameTa || <span className="text-vmuted text-xs">—</span>}</td>
                    <td className="px-3 py-2 text-vmuted">{c.contentCount ?? 0}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isActive ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-vmuted'}`}>{c.isActive ? 'Active' : 'Hidden'}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1.5">
                        <button onClick={() => startEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-lg glass text-vmuted" title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => run(() => setCategoryActive(c.id, !c.isActive), c.isActive ? `"${c.displayName}" hidden` : `"${c.displayName}" is now visible`)} className="w-7 h-7 flex items-center justify-center rounded-lg glass text-vmuted" title={c.isActive ? 'Hide' : 'Show'}>{c.isActive ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                        <button onClick={() => setDeleting(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/15 text-red-400" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {cats.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-vmuted">No categories — add one above.</td></tr>}
          </tbody>
        </table>
      </div>
      )}
      <p className="text-[10px] text-vmuted">Run <span className="font-mono">supabase/fix_categories_roles.sql</span> then <span className="font-mono">fix_categories_bilingual.sql</span>.</p>

      {deleting && (
        <ConfirmDialog
          title="Delete category?"
          message={deleting.contentCount
            ? `"${deleting.displayName}" is used by ${deleting.contentCount} item(s). Those items keep their label but the chip disappears — consider hiding it instead.`
            : `"${deleting.displayName}" will be removed from the ${section} chips.`}
          onConfirm={() => {
            const name = deleting.displayName;
            const id = deleting.id;
            setDeleting(null);
            run(() => deleteCategory(id), `Deleted "${name}"`);
          }}
          onCancel={() => setDeleting(null)}
          busy={busy}
        />
      )}
    </div>
  );
}
