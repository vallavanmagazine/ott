/**
 * Documentaries — long-form library management.
 *
 * The Explore tab is hidden from viewers right now, so nothing here reaches the
 * app yet; the screen stays fully functional so the library can be built up and
 * switched on later without a second pass.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Film, Trash2, Pencil, Eye } from 'lucide-react';
import { fetchAdminDocumentaryRows, type AdminDocumentary } from '@/services/documentaries';
import {
  createDocumentary, updateDocumentary, deleteDocumentary,
  publishDocumentary, unpublishDocumentary,
} from '@/services/admin-writes';
import { BunnyUpload, type BunnyUploadResult } from '@/components/BunnyUpload';
import { pexelsUrl } from '@/data/mockData';
import { useToast } from '@/components/admin/Toast';
import { useCategoryOptions } from '@/hooks/useCategoryOptions';
import { ALL_GENRES, BADGES, LANGUAGES, compactCount } from '@/lib/admin-options';
import { autoThumbnail } from '@/lib/video';
import { formatDuration } from '@/lib/transforms';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea, SelectInput,
  ToggleRow, SearchInput, StatusPill, StatCard, SkeletonTable, EmptyState,
  IconButton, VideoUrlHint, useBusy,
} from '@/components/admin/ui';

interface DocForm {
  title: string;
  titleTa: string;
  genre: string;
  durationSec: number;
  poster: string;
  backdrop: string;
  videoUrl: string;
  // Bunny provenance, set only by a successful BunnyUpload. Left undefined for
  // legacy (YouTube / DyneTube / manual URL) rows: the row mappers treat
  // undefined as "leave this column alone", so saving such a row never blanks
  // its thumbnail_url or rewrites its video_provider.
  thumbnailUrl?: string | null;
  videoProvider?: string | null;
  bunnyVideoId?: string | null;
  year: number;
  language: string;
  synopsis: string;
  synopsisTa: string;
  badge: string;
  exclusive: boolean;
  director: string;
  cast: string;
  status: 'Published' | 'Draft';
}

const BLANK: DocForm = {
  title: '', titleTa: '', genre: 'Environment', durationSec: 1500, poster: '', backdrop: '',
  videoUrl: '', year: new Date().getFullYear(), language: 'Tamil', synopsis: '', synopsisTa: '',
  badge: '', exclusive: false, director: '', cast: '', status: 'Draft',
};

function formFromDoc(d: AdminDocumentary): DocForm {
  return {
    title: d.title,
    titleTa: d.titleTa,
    genre: d.genre,
    durationSec: d.durationSec,
    poster: d.poster,
    backdrop: d.backdrop,
    videoUrl: d.videoUrl ?? '',
    year: d.year,
    language: d.language,
    synopsis: d.synopsis,
    synopsisTa: d.synopsisTa,
    badge: d.badge ?? '',
    exclusive: !!d.exclusive,
    director: d.director ?? '',
    cast: (d.cast ?? []).join(', '),
    status: d.status,
  };
}

export function AdminDocumentaries() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [rows, setRows] = useState<AdminDocumentary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All');
  const [editing, setEditing] = useState<AdminDocumentary | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminDocumentary | null>(null);

  const load = useCallback(async () => {
    setRows(await fetchAdminDocumentaryRows());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((d) => {
      const matchesQuery = !q || d.title.toLowerCase().includes(q) || d.titleTa.includes(query.trim())
        || (d.director ?? '').toLowerCase().includes(q);
      const matchesGenre = genreFilter === 'All' || d.genre === genreFilter;
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      return matchesQuery && matchesGenre && matchesStatus;
    });
  }, [rows, query, genreFilter, statusFilter]);

  const toggleStatus = (d: AdminDocumentary) => withBusy(d.id, async () => {
    try {
      if (d.status === 'Published') { await unpublishDocumentary(d.id, d.title); toast.success(`"${d.title}" moved to Draft`); }
      else { await publishDocumentary(d.id, d.title); toast.success(`"${d.title}" published`); }
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const save = async (form: DocForm) => {
    const payload = {
      title: form.title.trim(),
      titleTa: form.titleTa.trim() || form.title.trim(),
      genre: form.genre,
      durationSec: Number(form.durationSec) || 0,
      poster: form.poster.trim() || autoThumbnail(form.videoUrl) || '20212135',
      backdrop: form.backdrop.trim() || form.poster.trim() || autoThumbnail(form.videoUrl) || '20212135',
      year: Number(form.year) || new Date().getFullYear(),
      language: form.language,
      synopsis: form.synopsis.trim(),
      synopsisTa: form.synopsisTa.trim(),
      badge: form.badge || null,
      exclusive: form.exclusive,
      director: form.director.trim() || null,
      cast: form.cast.split(',').map((c) => c.trim()).filter(Boolean),
      videoUrl: form.videoUrl.trim() || null,
      thumbnailUrl: form.thumbnailUrl,
      videoProvider: form.videoProvider,
      bunnyVideoId: form.bunnyVideoId,
      status: form.status,
    };
    if (editing === 'new') {
      await createDocumentary(payload);
      toast.success(`"${payload.title}" saved as ${form.status}`);
    } else if (editing) {
      await updateDocumentary(editing.id, payload);
      toast.success(`"${payload.title}" updated`);
    }
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await withBusy(deleting.id, async () => {
      try {
        await deleteDocumentary(deleting.id, deleting.title);
        toast.success(`Deleted "${deleting.title}"`);
        setDeleting(null);
        await load();
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  const published = rows.filter((d) => d.status === 'Published').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Documentaries" value={rows.length} icon={<Film size={13} />} />
        <StatCard label="Published" value={published} accent="text-green-400" />
        <StatCard label="Drafts" value={rows.length - published} accent="text-vgold" />
        <StatCard label="Total Views" value={compactCount(rows.reduce((s, d) => s + d.views, 0))} accent="text-blue-400" />
      </div>

      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <p className="text-[11px] text-white/80">
          The Explore tab is currently hidden from viewers. Documentaries published here are stored and ready, and will
          appear as soon as the tab is re-enabled.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search title or director..." />
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
          <option value="All">All Genres</option>
          {ALL_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
          <option value="All">All Status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
        </select>
        <button onClick={() => setEditing('new')} className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95">
          <Plus size={16} /> Add New
        </button>
      </div>

      {loading ? <SkeletonTable rows={6} cols={6} /> : filtered.length === 0 ? (
        <EmptyState title={rows.length === 0 ? 'No documentaries yet' : 'Nothing matches those filters'} />
      ) : (
        <div className="rounded-xl glass overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                <th className="text-left px-3 py-3 font-bold">Poster</th>
                <th className="text-left px-4 py-3 font-bold">Title</th>
                <th className="text-left px-4 py-3 font-bold">Genre</th>
                <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Year</th>
                <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Duration</th>
                <th className="text-left px-4 py-3 font-bold">Status</th>
                <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Uploaded</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-white/5 transition">
                  <td className="px-3 py-3">
                    <div className="w-10 h-14 rounded-lg overflow-hidden bg-white/5">
                      <img src={pexelsUrl(d.poster, 120)} alt="" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <div className="font-semibold text-white text-[13px] truncate">{d.title}</div>
                    <div className="text-[11px] font-tamil text-vmuted truncate">{d.titleTa}</div>
                    {d.director && <div className="text-[10px] text-vmuted mt-0.5">dir. {d.director}</div>}
                  </td>
                  <td className="px-4 py-3 text-vmuted">{d.genre}</td>
                  <td className="px-4 py-3 text-vmuted hidden md:table-cell">{d.year}</td>
                  <td className="px-4 py-3 text-vmuted hidden md:table-cell tabular-nums">{d.duration}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(d)} disabled={isBusy(d.id)} title="Click to toggle Published / Draft">
                      <StatusPill status={d.status} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-vmuted hidden lg:table-cell tabular-nums">{d.views.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{d.uploaded}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {d.videoUrl && (
                        <a href={d.videoUrl} target="_blank" rel="noreferrer" title="Open source video" className="w-7 h-7 flex items-center justify-center rounded-lg text-vmuted hover:bg-white/10 hover:text-white">
                          <Eye size={14} />
                        </a>
                      )}
                      <IconButton onClick={() => setEditing(d)} title="Edit"><Pencil size={14} /></IconButton>
                      <IconButton onClick={() => setDeleting(d)} title="Delete" danger><Trash2 size={14} /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <DocFormModal
          initial={editing === 'new' ? BLANK : formFromDoc(editing)}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete documentary?"
          message={`"${deleting.title}" will be permanently removed from the library.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isBusy(deleting.id)}
        />
      )}
    </div>
  );
}

function DocFormModal({
  initial, isNew, onClose, onSave,
}: { initial: DocForm; isNew: boolean; onClose: () => void; onSave: (f: DocForm) => Promise<void> }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [posterTouched, setPosterTouched] = useState(!!initial.poster);
  const genreOptions = useCategoryOptions('explore', ALL_GENRES);

  const set = <K extends keyof DocForm>(k: K, v: DocForm[K]) => setForm((f) => ({ ...f, [k]: v }));

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
    if (uploadBusy) { uploadInFlight(); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={isNew ? 'Add Documentary' : 'Edit Documentary'}
      subtitle={isNew ? undefined : form.title}
      onClose={guardedClose}
      footer={<SaveBar onCancel={guardedClose} onSave={submit} saving={saving} label={form.status === 'Published' ? 'Save & Publish' : 'Save Draft'} disabled={uploadBusy} />}
    >
      <Field label="Video URL" hint="Paste a link, or upload a file">
        <TextInput value={form.videoUrl} onChange={(e) => onVideoUrl(e.target.value)} placeholder="https://..." />
        <VideoUrlHint url={form.videoUrl} />
      </Field>

      <BunnyUpload table="documentaries" title={form.title} onComplete={onBunnyComplete} onBusyChange={setUploadBusy} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Poster image" hint="Portrait 2:3">
          <TextInput value={form.poster} onChange={(e) => { setPosterTouched(true); set('poster', e.target.value); }} placeholder="URL or Pexels id" />
        </Field>
        <Field label="Backdrop image" hint="Landscape 16:9">
          <TextInput value={form.backdrop} onChange={(e) => set('backdrop', e.target.value)} placeholder="URL or Pexels id" />
        </Field>
      </div>

      <Field label="Title (English)" required>
        <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="The Last Mangroves" />
      </Field>
      <Field label="Title (Tamil)">
        <TextInput className="font-tamil" value={form.titleTa} onChange={(e) => set('titleTa', e.target.value)} placeholder="தலைப்பு" />
      </Field>

      <Field label="Synopsis (English)">
        <TextArea rows={3} value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} />
      </Field>
      <Field label="Synopsis (Tamil)">
        <TextArea rows={3} className="font-tamil" value={form.synopsisTa} onChange={(e) => set('synopsisTa', e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Genre">
          <SelectInput value={form.genre} onChange={(e) => set('genre', e.target.value)}>
            {genreOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Year">
          <TextInput type="number" value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Language">
          <SelectInput value={form.language} onChange={(e) => set('language', e.target.value)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </SelectInput>
        </Field>
        <Field label="Duration (seconds)" hint={`Shows as ${formatDuration(Number(form.durationSec) || 0)}`}>
          <TextInput type="number" min={0} value={form.durationSec} onChange={(e) => set('durationSec', Number(e.target.value))} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Director">
          <TextInput value={form.director} onChange={(e) => set('director', e.target.value)} />
        </Field>
        <Field label="Badge">
          <SelectInput value={form.badge} onChange={(e) => set('badge', e.target.value)}>
            {BADGES.map((b) => <option key={b || 'none'} value={b}>{b || 'None'}</option>)}
          </SelectInput>
        </Field>
      </div>

      <Field label="Cast" hint="Comma-separated — stored as a list.">
        <TextInput value={form.cast} onChange={(e) => set('cast', e.target.value)} placeholder="Name One, Name Two" />
      </Field>

      <ToggleRow on={form.exclusive} onChange={(v) => set('exclusive', v)} label="Vallavan Exclusive" sub="Shows the exclusive ribbon on the card" />

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
