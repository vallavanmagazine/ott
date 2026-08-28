/**
 * Feed Content — the primary content surface (the viewer app currently shows
 * Search | Feed | Profile only, so this is where day-to-day publishing happens).
 *
 * Full CRUD against `feed_reels`: create, edit, delete, inline publish toggle,
 * inline ad-placement flags and persisted reordering. Every mutation logs to
 * audit_logs via the service layer and reports through a toast.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Film, ChevronUp, ChevronDown, Pencil, Trash2, Link2, Eye,
} from 'lucide-react';
import { pexelsUrl, type FeedContentType } from '@/data/mockData';
import { fetchAdminFeedReels, type AdminFeedReel } from '@/services/feed';
import {
  createFeedReel, updateFeedReel, deleteFeedReel,
  setFeedReelStatus, setFeedReelAdFlags, reorderFeedReels,
} from '@/services/admin-writes';
import { fetchCampaignOptions } from '@/services/admin-campaigns';
import { DyneTubeUpload } from '@/components/DyneTubeUpload';
import { useToast } from '@/components/admin/Toast';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';
import { ALL_GENRES, CONTENT_TYPES, compactCount } from '@/lib/admin-options';
import { autoThumbnail, videoKindLabel, secondsToClock } from '@/lib/video';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea, SelectInput,
  ToggleRow, InlineToggle, SearchInput, StatusPill, StatCard, SkeletonTable,
  EmptyState, IconButton, useBusy,
} from '@/components/admin/ui';

const CAPTION_MAX = 200;

const typeColors: Record<string, string> = {
  News: 'text-red-300 bg-red-500/15',
  Teaser: 'text-purple-300 bg-purple-500/15',
  'Short Story': 'text-green-300 bg-green-500/15',
  Other: 'text-white/60 bg-white/10',
};

interface FeedForm {
  videoUrl: string;
  thumb: string;
  title: string;
  titleTa: string;
  caption: string;
  captionTa: string;
  creator: string;
  creatorHandle: string;
  contentType: FeedContentType;
  genre: string;
  durationSec: number;
  status: 'Published' | 'Draft';
  stripAdHost: boolean;
  bannerAfter: boolean;
  attachedCampaignId: string;
}

const BLANK_FORM: FeedForm = {
  videoUrl: '',
  thumb: '',
  title: '',
  titleTa: '',
  caption: '',
  captionTa: '',
  creator: 'Vallavan News',
  creatorHandle: '@vallavannews',
  contentType: 'News',
  genre: 'Society',
  durationSec: 30,
  status: 'Draft',
  stripAdHost: false,
  bannerAfter: false,
  attachedCampaignId: '',
};

function formFromReel(r: AdminFeedReel): FeedForm {
  return {
    videoUrl: r.videoUrl ?? '',
    thumb: r.thumb ?? '',
    title: r.title,
    titleTa: r.titleTa,
    caption: r.caption ?? '',
    captionTa: r.captionTa ?? '',
    creator: r.creator ?? '',
    creatorHandle: r.creatorHandle ?? '',
    contentType: r.contentType,
    genre: r.genre,
    durationSec: r.durationSec ?? 30,
    status: r.status === 'Published' ? 'Published' : 'Draft',
    stripAdHost: !!r.stripAdHost,
    bannerAfter: !!r.bannerAfter,
    attachedCampaignId: r.attachedCampaignId ?? '',
  };
}

export function AdminFeedContent() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [reels, setReels] = useState<AdminFeedReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FeedContentType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Published' | 'Draft'>('All');

  const [editing, setEditing] = useState<AdminFeedReel | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminFeedReel | null>(null);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    const rows = await fetchAdminFeedReels();
    setReels(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetchCampaignOptions().then(setCampaigns).catch(() => setCampaigns([]));
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reels.filter((r) => {
      const matchesQuery = !q
        || r.title.toLowerCase().includes(q)
        || r.titleTa.includes(query.trim())
        || (r.creator ?? '').toLowerCase().includes(q);
      const matchesType = filterType === 'All' || r.contentType === filterType;
      const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
      return matchesQuery && matchesType && matchesStatus;
    });
  }, [reels, query, filterType, filterStatus]);

  // --- inline actions ----------------------------------------------------
  const toggleStatus = (r: AdminFeedReel) => withBusy(r.id, async () => {
    const next = r.status === 'Published' ? 'Draft' : 'Published';
    setReels((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    try {
      await setFeedReelStatus(r.id, next, r.title);
      toast.success(`"${r.title}" is now ${next}`);
    } catch (e) {
      setReels((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)));
      toast.error((e as Error).message);
    }
  });

  const toggleFlag = (r: AdminFeedReel, key: 'stripAdHost' | 'bannerAfter') => withBusy(r.id, async () => {
    const next = !r[key];
    setReels((prev) => prev.map((x) => (x.id === r.id ? { ...x, [key]: next } : x)));
    try {
      await setFeedReelAdFlags(r.id, { [key]: next }, r.title);
      toast.success(key === 'stripAdHost' ? 'Strip ad host updated' : 'Banner-after updated');
    } catch (e) {
      setReels((prev) => prev.map((x) => (x.id === r.id ? { ...x, [key]: r[key] } : x)));
      toast.error((e as Error).message);
    }
  });

  const move = async (id: string, dir: -1 | 1) => {
    const sorted = [...reels].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((r) => r.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
    const reordered = sorted.map((r, i) => ({ ...r, order: i }));
    setReels(reordered);
    try {
      await reorderFeedReels(reordered.map((r) => r.id));
    } catch (e) {
      toast.error(`Reorder failed: ${(e as Error).message}`);
      await load();
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await withBusy(deleting.id, async () => {
      try {
        await deleteFeedReel(deleting.id, deleting.title);
        toast.success(`Deleted "${deleting.title}"`);
        setDeleting(null);
        await load();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  const save = async (form: FeedForm) => {
    const payload = {
      title: form.title.trim(),
      titleTa: form.titleTa.trim(),
      caption: form.caption.trim(),
      captionTa: form.captionTa.trim(),
      creator: form.creator.trim() || 'Vallavan News',
      creatorHandle: form.creatorHandle.trim() || '@vallavannews',
      contentType: form.contentType,
      genre: form.genre,
      durationSec: Number(form.durationSec) || 30,
      thumb: form.thumb.trim() || autoThumbnail(form.videoUrl) || '20212135',
      status: form.status,
      stripAdHost: form.stripAdHost,
      bannerAfter: form.bannerAfter,
      videoUrl: form.videoUrl.trim() || null,
      attachedCampaignId: form.attachedCampaignId || null,
    };

    if (editing === 'new') {
      await createFeedReel({ ...payload, sortOrder: reels.length });
      toast.success(`"${payload.title}" saved as ${form.status}`);
    } else if (editing) {
      await updateFeedReel(editing.id, payload);
      toast.success(`"${payload.title}" updated`);
    }
    setEditing(null);
    await load();
  };

  const published = reels.filter((r) => r.status === 'Published').length;
  const totalViews = reels.reduce((s, r) => s + (r.views ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Reels" value={reels.length} icon={<Film size={13} />} />
        <StatCard label="Published" value={published} accent="text-green-400" />
        <StatCard label="Drafts" value={reels.length - published} accent="text-vgold" />
        <StatCard label="Total Views" value={compactCount(totalViews)} accent="text-blue-400" />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by title, Tamil title or creator..." />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FeedContentType | 'All')}
          className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
        >
          <option value="All">All Types</option>
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Published' | 'Draft')}
          className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
        >
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
        <button
          onClick={() => setEditing('new')}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={reels.length === 0 ? 'No feed content yet' : 'Nothing matches those filters'}
          hint={reels.length === 0 ? 'Click "Add New" to publish the first reel.' : undefined}
        />
      ) : (
        <div className="rounded-xl glass overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                <th className="text-left px-3 py-3 font-bold w-12">Order</th>
                <th className="text-left px-3 py-3 font-bold">Thumb</th>
                <th className="text-left px-4 py-3 font-bold">Title</th>
                <th className="text-left px-3 py-3 font-bold">Type</th>
                <th className="text-left px-3 py-3 font-bold hidden md:table-cell">Dur.</th>
                <th className="text-left px-3 py-3 font-bold">Status</th>
                <th className="text-left px-3 py-3 font-bold hidden lg:table-cell">Views</th>
                <th className="text-left px-3 py-3 font-bold hidden xl:table-cell">Uploaded</th>
                <th className="text-center px-3 py-3 font-bold">Strip</th>
                <th className="text-center px-3 py-3 font-bold">Banner</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <button onClick={() => move(r.id, -1)} className="w-6 h-5 flex items-center justify-center rounded hover:bg-white/10 text-vmuted">
                        <ChevronUp size={13} />
                      </button>
                      <span className="text-[10px] text-vmuted tabular-nums">{r.order + 1}</span>
                      <button onClick={() => move(r.id, 1)} className="w-6 h-5 flex items-center justify-center rounded hover:bg-white/10 text-vmuted">
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5">
                      <img src={pexelsUrl(r.thumb, 150)} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="font-semibold text-white text-[13px] truncate">{r.title}</div>
                    <div className="text-[11px] font-tamil text-vmuted truncate">{r.titleTa}</div>
                    <div className="text-[10px] text-vmuted mt-0.5 flex items-center gap-1.5">
                      {r.creator}
                      {r.videoUrl && <span className="text-vgold flex items-center gap-0.5"><Link2 size={9} />{videoKindLabel(r.videoUrl)}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors[r.contentType] ?? typeColors.Other}`}>
                      {r.contentType}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-vmuted hidden md:table-cell tabular-nums">{r.duration}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleStatus(r)} disabled={isBusy(r.id)} title="Click to toggle Published / Draft">
                      <StatusPill status={r.status} />
                    </button>
                  </td>
                  <td className="px-3 py-3 text-vmuted hidden lg:table-cell tabular-nums">{(r.views ?? 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-vmuted hidden xl:table-cell">{r.uploaded}</td>
                  <td className="px-3 py-3 text-center">
                    <InlineToggle on={r.stripAdHost} onClick={() => toggleFlag(r, 'stripAdHost')} title="Strip ad host" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <InlineToggle on={r.bannerAfter} onClick={() => toggleFlag(r, 'bannerAfter')} title="Banner ad after this reel" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {r.videoUrl && (
                        <a
                          href={r.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open source video"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-vmuted hover:bg-white/10 hover:text-white"
                        >
                          <Eye size={14} />
                        </a>
                      )}
                      <IconButton onClick={() => setEditing(r)} title="Edit"><Pencil size={14} /></IconButton>
                      <IconButton onClick={() => setDeleting(r)} title="Delete" danger><Trash2 size={14} /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-vmuted">{filtered.length} of {reels.length} reels</p>

      {editing && (
        <FeedFormModal
          initial={editing === 'new' ? BLANK_FORM : formFromReel(editing)}
          isNew={editing === 'new'}
          campaigns={campaigns}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete feed content?"
          message={`"${deleting.title}" will be permanently removed from the feed. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isBusy(deleting.id)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / edit form
// ---------------------------------------------------------------------------
function FeedFormModal({
  initial, isNew, campaigns, onClose, onSave,
}: {
  initial: FeedForm;
  isNew: boolean;
  campaigns: { id: string; name: string }[];
  onClose: () => void;
  onSave: (form: FeedForm) => Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState<FeedForm>(initial);
  const [saving, setSaving] = useState(false);
  /** True once the admin edits the thumbnail by hand — stops the auto-fill. */
  const [thumbTouched, setThumbTouched] = useState(!!initial.thumb);

  const typeOptions = useCategoryOptions('feed', CONTENT_TYPES);
  const genreOptions = useCategoryOptions('explore', ALL_GENRES);

  const set = <K extends keyof FeedForm>(key: K, value: FeedForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /** YouTube is the only source with a derivable thumbnail — auto-fill from it. */
  const onVideoUrl = (url: string) => {
    setForm((f) => {
      const auto = autoThumbnail(url);
      return { ...f, videoUrl: url, thumb: !thumbTouched && auto ? auto : f.thumb };
    });
  };

  const previewThumb = form.thumb || autoThumbnail(form.videoUrl) || '';

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Title (English) is required'); return; }
    if (!form.titleTa.trim()) { toast.error('Title (Tamil) is required'); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal
      title={isNew ? 'Add New Feed Content' : 'Edit Feed Content'}
      subtitle={isNew ? 'Publishes to the viewer Feed tab' : form.title}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label={form.status === 'Published' ? 'Save & Publish' : 'Save Draft'} />}
    >
      <Field label="Video URL" hint="YouTube, DyneTube, HLS (.m3u8) or MP4">
        <TextInput value={form.videoUrl} onChange={(e) => onVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        {form.videoUrl && <p className="text-[10px] text-vgold mt-1">Detected: {videoKindLabel(form.videoUrl)}</p>}
      </Field>

      <DyneTubeUpload onUploaded={onVideoUrl} />

      <Field
        label="Thumbnail URL"
        hint={autoThumbnail(form.videoUrl) ? 'Auto-filled from the YouTube URL — edit to override.' : 'Full image URL, or a Pexels photo id.'}
      >
        <div className="flex gap-2">
          <TextInput
            value={form.thumb}
            onChange={(e) => { setThumbTouched(true); set('thumb', e.target.value); }}
            placeholder="https://... or 20212135"
          />
          {previewThumb && (
            <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              <img src={pexelsUrl(previewThumb, 150)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Field>

      <Field label="Title (English)" required>
        <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Cauvery Delta Crisis" />
      </Field>

      <Field label="Title (Tamil)" required>
        <TextInput className="font-tamil" value={form.titleTa} onChange={(e) => set('titleTa', e.target.value)} placeholder="தலைப்பு" />
      </Field>

      <Field label="Caption / Description" counter={`${form.caption.length}/${CAPTION_MAX}`}>
        <TextArea
          rows={3}
          maxLength={CAPTION_MAX}
          value={form.caption}
          onChange={(e) => set('caption', e.target.value)}
          placeholder="Brief description shown under the reel..."
        />
      </Field>

      <Field label="Caption (Tamil)" counter={`${form.captionTa.length}/${CAPTION_MAX}`}>
        <TextArea
          rows={2}
          maxLength={CAPTION_MAX}
          className="font-tamil"
          value={form.captionTa}
          onChange={(e) => set('captionTa', e.target.value)}
          placeholder="தமிழ் விளக்கம்"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Creator name">
          <TextInput value={form.creator} onChange={(e) => set('creator', e.target.value)} placeholder="Vallavan News" />
        </Field>
        <Field label="Creator handle">
          <TextInput value={form.creatorHandle} onChange={(e) => set('creatorHandle', e.target.value)} placeholder="@vallavannews" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Content Type">
          <SelectInput value={form.contentType} onChange={(e) => set('contentType', e.target.value as FeedContentType)}>
            {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Genre">
          <SelectInput value={form.genre} onChange={(e) => set('genre', e.target.value)}>
            {genreOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectInput>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration (seconds)" hint={`Shows as ${secondsToClock(Number(form.durationSec) || 0)}`}>
          <TextInput
            type="number"
            min={1}
            value={form.durationSec}
            onChange={(e) => set('durationSec', Number(e.target.value))}
          />
        </Field>
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
      </div>

      <div className="p-3 rounded-xl glass space-y-2.5">
        <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Ad Placement</div>
        <ToggleRow
          on={form.stripAdHost}
          onChange={(v) => set('stripAdHost', v)}
          label="Strip Ad Host"
          sub="Eligible for the bottom strip ad overlay"
        />
        <ToggleRow
          on={form.bannerAfter}
          onChange={(v) => set('bannerAfter', v)}
          label="Banner Ad After This"
          sub="Pin a sponsored interstitial after this reel"
        />
        {form.bannerAfter && (
          <Field label="Attach Campaign" hint="Leave unset to let the geo ad engine pick.">
            <SelectInput value={form.attachedCampaignId} onChange={(e) => set('attachedCampaignId', e.target.value)}>
              <option value="">Auto (geo-targeted rotation)</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </SelectInput>
          </Field>
        )}
      </div>
    </AdminModal>
  );
}
