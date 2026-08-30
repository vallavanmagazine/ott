/**
 * Inspire — sponsor-funded profile films and motivational shorts.
 *
 * Unlike Feed and Documentaries, an Inspire item can be a paid production: the
 * sponsorship fields drive the sponsor credit shown alongside the video, and
 * link the item back to the sponsor who bought the package.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Sparkles, Trash2, Pencil, Eye } from 'lucide-react';
import { fetchAdminInspireItems, type AdminInspireItem } from '@/services/inspire';
import {
  createInspireItem, updateInspireItem, deleteInspireItem, setInspireStatus,
} from '@/services/admin-writes';
import { fetchSponsorOptions } from '@/services/admin-campaigns';
import { BunnyUpload, type BunnyUploadResult } from '@/components/BunnyUpload';
import { pexelsUrl } from '@/data/mockData';
import { useToast } from '@/components/admin/Toast';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';
import { BADGES } from '@/lib/admin-options';
import { autoThumbnail } from '@/lib/video';
import { formatDuration } from '@/lib/transforms';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea, SelectInput,
  ToggleRow, SearchInput, StatusPill, StatCard, SkeletonTable, EmptyState,
  IconButton, VideoUrlHint, useBusy,
} from '@/components/admin/ui';

interface InspireForm {
  title: string;
  titleTa: string;
  category: string;
  durationSec: number;
  poster: string;
  videoUrl: string;
  // Bunny provenance, set only by a successful BunnyUpload. Left undefined for
  // legacy (YouTube / DyneTube / manual URL) rows: the row mappers treat
  // undefined as "leave this column alone", so saving such a row never blanks
  // its thumbnail_url or rewrites its video_provider.
  thumbnailUrl?: string | null;
  videoProvider?: string | null;
  bunnyVideoId?: string | null;
  quote: string;
  attribution: string;
  badge: string;
  status: 'Published' | 'Draft';
  isSponsored: boolean;
  sponsorId: string;
  sponsorLogoUrl: string;
}

const BLANK: InspireForm = {
  title: '', titleTa: '', category: 'Motivation', durationSec: 180, poster: '', videoUrl: '',
  quote: '', attribution: '', badge: '', status: 'Draft',
  isSponsored: false, sponsorId: '', sponsorLogoUrl: '',
};

function formFromItem(i: AdminInspireItem): InspireForm {
  return {
    title: i.title,
    titleTa: i.titleTa,
    category: i.category,
    durationSec: i.durationSec,
    poster: i.poster,
    videoUrl: i.videoUrl ?? '',
    quote: i.quote ?? '',
    attribution: i.attribution ?? '',
    badge: i.badge ?? '',
    status: i.status,
    isSponsored: i.isSponsored,
    sponsorId: i.sponsorId ?? '',
    sponsorLogoUrl: i.sponsorLogoUrl,
  };
}

export function AdminInspireContent() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [items, setItems] = useState<AdminInspireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sponsors, setSponsors] = useState<{ id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<AdminInspireItem | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminInspireItem | null>(null);

  const categoryOptions = useCategoryOptions('inspire');

  const load = useCallback(async () => {
    setItems(await fetchAdminInspireItems());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetchSponsorOptions().then(setSponsors).catch(() => {});
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchesQuery = !q || i.title.toLowerCase().includes(q) || i.titleTa.includes(query.trim());
      const matchesCat = categoryFilter === 'All' || i.category === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [items, query, categoryFilter]);

  const toggleStatus = (i: AdminInspireItem) => withBusy(i.id, async () => {
    const next = i.status === 'Published' ? 'Draft' : 'Published';
    try {
      await setInspireStatus(i.id, next, i.title);
      toast.success(`"${i.title}" is now ${next}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const save = async (form: InspireForm) => {
    const payload = {
      title: form.title.trim(),
      titleTa: form.titleTa.trim() || form.title.trim(),
      category: form.category,
      durationSec: Number(form.durationSec) || 180,
      poster: form.poster.trim() || autoThumbnail(form.videoUrl) || '20212135',
      quote: form.quote.trim() || null,
      attribution: form.attribution.trim() || null,
      badge: form.badge || null,
      videoUrl: form.videoUrl.trim() || null,
      thumbnailUrl: form.thumbnailUrl,
      videoProvider: form.videoProvider,
      bunnyVideoId: form.bunnyVideoId,
      status: form.status,
      isSponsored: form.isSponsored,
      sponsorId: form.isSponsored ? (form.sponsorId || null) : null,
      sponsorLogoUrl: form.isSponsored ? (form.sponsorLogoUrl.trim() || null) : null,
    };
    if (editing === 'new') {
      await createInspireItem({ ...payload, sortOrder: items.length });
      toast.success(`"${payload.title}" saved as ${form.status}`);
    } else if (editing) {
      await updateInspireItem(editing.id, payload);
      toast.success(`"${payload.title}" updated`);
    }
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await withBusy(deleting.id, async () => {
      try {
        await deleteInspireItem(deleting.id, deleting.title);
        toast.success(`Deleted "${deleting.title}"`);
        setDeleting(null);
        await load();
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  const published = items.filter((i) => i.status === 'Published').length;
  const sponsored = items.filter((i) => i.isSponsored).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Inspire Items" value={items.length} icon={<Sparkles size={13} />} />
        <StatCard label="Published" value={published} accent="text-green-400" />
        <StatCard label="Drafts" value={items.length - published} accent="text-vgold" />
        <StatCard label="Sponsored" value={sponsored} accent="text-blue-400" />
      </div>

      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-[11px] text-white/80">
          The Inspire tab is currently hidden from viewers. Items published here are stored and ready for when it is
          re-enabled.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search Inspire items..." />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
          <option value="All">All Categories</option>
          {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setEditing('new')} className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95">
          <Plus size={16} /> Add New
        </button>
      </div>

      {loading ? <SkeletonTable rows={5} cols={5} /> : filtered.length === 0 ? (
        <EmptyState title={items.length === 0 ? 'No Inspire content yet' : 'Nothing matches those filters'} />
      ) : (
        <div className="rounded-xl glass overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                <th className="text-left px-3 py-3 font-bold">Poster</th>
                <th className="text-left px-4 py-3 font-bold">Title</th>
                <th className="text-left px-4 py-3 font-bold">Category</th>
                <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 font-bold">Status</th>
                <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Sponsor</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3">
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5">
                      <img src={pexelsUrl(i.poster, 120)} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <div className="font-semibold text-white text-[13px] truncate">{i.title}</div>
                    <div className="text-[11px] font-tamil text-vmuted truncate">{i.titleTa}</div>
                    {i.quote && <div className="text-[10px] text-vmuted italic truncate mt-0.5">"{i.quote}"</div>}
                  </td>
                  <td className="px-4 py-3 text-vmuted">{i.category}</td>
                  <td className="px-4 py-3 text-vmuted hidden md:table-cell tabular-nums">{i.duration}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(i)} disabled={isBusy(i.id)} title="Click to toggle Published / Draft">
                      <StatusPill status={i.status} />
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {i.isSponsored
                      ? <span className="text-[11px] text-vgold">{i.sponsorName || 'Sponsored'}</span>
                      : <span className="text-[11px] text-vmuted">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {i.videoUrl && (
                        <a href={i.videoUrl} target="_blank" rel="noreferrer" title="Open source video" className="w-7 h-7 flex items-center justify-center rounded-lg text-vmuted hover:bg-white/10 hover:text-white">
                          <Eye size={14} />
                        </a>
                      )}
                      <IconButton onClick={() => setEditing(i)} title="Edit"><Pencil size={14} /></IconButton>
                      <IconButton onClick={() => setDeleting(i)} title="Delete" danger><Trash2 size={14} /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <InspireFormModal
          initial={editing === 'new' ? BLANK : formFromItem(editing)}
          isNew={editing === 'new'}
          sponsors={sponsors}
          categories={categoryOptions}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Inspire item?"
          message={`"${deleting.title}" will be permanently removed.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isBusy(deleting.id)}
        />
      )}
    </div>
  );
}

function InspireFormModal({
  initial, isNew, sponsors, categories, onClose, onSave,
}: {
  initial: InspireForm;
  isNew: boolean;
  sponsors: { id: string; name: string }[];
  categories: { value: string; label: string }[];
  onClose: () => void;
  onSave: (f: InspireForm) => Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [posterTouched, setPosterTouched] = useState(!!initial.poster);

  const set = <K extends keyof InspireForm>(k: K, v: InspireForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onVideoUrl = (url: string) => {
    setForm((f) => {
      const auto = autoThumbnail(url);
      return { ...f, videoUrl: url, poster: !posterTouched && auto ? auto : f.poster };
    });
  };

  /**
   * A finished Bunny upload fills the form; the existing Save button persists
   * it. Nothing is written to the database here, so this behaves the same in
   * "Add" (no row yet) and "Edit" — matching the DyneTube flow it replaces.
   */
  const onBunnyComplete = (r: BunnyUploadResult) => {
    setForm((f) => ({
      ...f,
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl,
      videoProvider: r.videoProvider,
      bunnyVideoId: r.bunnyVideoId,
      // Bunny generates a real poster frame; adopt it unless the admin has
      // already chosen an image (same rule autoThumbnail() follows for YouTube).
      poster: !posterTouched && r.thumbnailUrl ? r.thumbnailUrl : f.poster,
    }));
  };

  /**
   * A Bunny upload only reaches the form when it finishes, so saving or closing
   * mid-upload silently threw it away — that is how a row ended up with no
   * video_url and the '20212135' placeholder thumbnail. Both exits are now
   * blocked while an upload is in flight; the widget's own Cancel is the way
   * out if the admin no longer wants it.
   */
  const uploadInFlight = () =>
    toast.error('Video is still uploading — wait for it to finish, or hit Cancel under the upload button.');
  const guardedClose = () => { if (uploadBusy) { uploadInFlight(); return; } onClose(); };

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Title (English) is required'); return; }
    if (form.isSponsored && !form.sponsorId) { toast.error('Pick the sponsor, or turn sponsorship off'); return; }
    if (uploadBusy) { uploadInFlight(); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={isNew ? 'Add Inspire Content' : 'Edit Inspire Content'}
      subtitle={isNew ? undefined : form.title}
      onClose={guardedClose}
      footer={<SaveBar onCancel={guardedClose} onSave={submit} saving={saving} label={form.status === 'Published' ? 'Save & Publish' : 'Save Draft'} disabled={uploadBusy} />}
    >
      <Field label="Video URL" hint="Paste a link, or upload a file">
        <TextInput value={form.videoUrl} onChange={(e) => onVideoUrl(e.target.value)} placeholder="https://..." />
        <VideoUrlHint url={form.videoUrl} />
      </Field>

      <BunnyUpload table="inspire_items" title={form.title} onComplete={onBunnyComplete} onBusyChange={setUploadBusy} />

      <Field label="Poster / Thumbnail" hint={autoThumbnail(form.videoUrl) ? 'Auto-filled from the video URL — edit to override.' : 'URL or Pexels photo id.'}>
        <TextInput value={form.poster} onChange={(e) => { setPosterTouched(true); set('poster', e.target.value); }} />
      </Field>

      <Field label="Title (English)" required>
        <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} />
      </Field>
      <Field label="Title (Tamil)">
        <TextInput className="font-tamil" value={form.titleTa} onChange={(e) => set('titleTa', e.target.value)} placeholder="தலைப்பு" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <SelectInput value={form.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Duration (seconds)" hint={`Shows as ${formatDuration(Number(form.durationSec) || 0)}`}>
          <TextInput type="number" min={1} value={form.durationSec} onChange={(e) => set('durationSec', Number(e.target.value))} />
        </Field>
      </div>

      <Field label="Quote">
        <TextArea rows={2} value={form.quote} onChange={(e) => set('quote', e.target.value)} placeholder="The pull-quote shown on the card" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Attribution">
          <TextInput value={form.attribution} onChange={(e) => set('attribution', e.target.value)} placeholder="— Name, Role" />
        </Field>
        <Field label="Badge">
          <SelectInput value={form.badge} onChange={(e) => set('badge', e.target.value)}>
            {BADGES.map((b) => <option key={b || 'none'} value={b}>{b || 'None'}</option>)}
          </SelectInput>
        </Field>
      </div>

      <div className="p-3 rounded-xl glass space-y-2.5">
        <ToggleRow
          on={form.isSponsored}
          onChange={(v) => set('isSponsored', v)}
          label="Sponsored production"
          sub="Paid Spotlight / Prestige package — shows a sponsor credit"
        />
        {form.isSponsored && (
          <>
            <Field label="Sponsor" required>
              <SelectInput value={form.sponsorId} onChange={(e) => set('sponsorId', e.target.value)}>
                <option value="">Select sponsor…</option>
                {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Sponsor logo URL">
              <TextInput value={form.sponsorLogoUrl} onChange={(e) => set('sponsorLogoUrl', e.target.value)} placeholder="https://..." />
            </Field>
          </>
        )}
      </div>

      <Field label="Status">
        <div className="grid grid-cols-2 gap-2">
          {(['Draft', 'Published'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('status', s)}
              className={`py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${form.status === s ? 'bg-vred text-white' : 'glass text-vmuted'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
    </AdminModal>
  );
}
