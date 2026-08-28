/**
 * Social Media — compose, auto-generate and queue posts.
 *
 * Nothing on this screen publishes to Meta, X or YouTube. Posts are composed
 * and queued in `social_posts`; the actual publish is a server-side step that
 * stays behind explicit human approval, so the strongest action here is
 * "schedule".
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, Calendar, Sparkles, Trash2, Pencil, Wand2, Megaphone, Info } from 'lucide-react';
import {
  fetchContentOptions, fetchSocialPosts, fetchActiveCampaignAds,
  createSocialPost, updateSocialPost, deleteSocialPost,
  buildCaption, generateTodaysPosts,
  type ContentOption, type SocialPostRow,
} from '@/services/admin-social';
import { useToast } from '@/components/admin/Toast';
import { SOCIAL_PLATFORMS } from '@/lib/admin-options';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextArea, SelectInput,
  StatusPill, StatCard, SkeletonTable, EmptyState, IconButton, Tabs, useBusy,
} from '@/components/admin/ui';

type Tab = 'compose' | 'queue';

export function AdminSocial() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [tab, setTab] = useState<Tab>('compose');
  const [posts, setPosts] = useState<SocialPostRow[]>([]);
  const [content, setContent] = useState<ContentOption[]>([]);
  const [ads, setAds] = useState<{ id: string; headline: string; sponsor: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [contentId, setContentId] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Facebook', 'Instagram']);
  const [adId, setAdId] = useState('');
  const [caption, setCaption] = useState('');
  const [captionTouched, setCaptionTouched] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const [editing, setEditing] = useState<SocialPostRow | null>(null);
  const [deleting, setDeleting] = useState<SocialPostRow | null>(null);

  const load = useCallback(async () => {
    const [p, c, a] = await Promise.all([fetchSocialPosts(), fetchContentOptions(), fetchActiveCampaignAds()]);
    setPosts(p); setContent(c); setAds(a);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => content.find((c) => c.id === contentId), [content, contentId]);
  const selectedAd = useMemo(() => ads.find((a) => a.id === adId), [ads, adId]);

  /** Regenerate the caption whenever the source changes, unless hand-edited. */
  useEffect(() => {
    if (captionTouched || !selected) return;
    setCaption(buildCaption(selected, selectedAd?.sponsor));
  }, [selected, selectedAd, captionTouched]);

  const togglePlatform = (p: string) =>
    setPlatforms((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]));

  const submit = async (status: 'draft' | 'scheduled') => {
    if (!caption.trim()) { toast.error('Caption is required'); return; }
    if (platforms.length === 0) { toast.error('Pick at least one platform'); return; }
    if (status === 'scheduled' && !scheduleAt) { toast.error('Pick a date and time to schedule'); return; }
    setSaving(true);
    try {
      await createSocialPost({
        contentType: selected?.type ?? null,
        contentId: selected?.id ?? null,
        caption: caption.trim(),
        platforms,
        embeddedAdId: adId || null,
        status,
        scheduledAt: status === 'scheduled' ? new Date(scheduleAt).toISOString() : null,
      });
      toast.success(status === 'scheduled' ? 'Post scheduled' : 'Draft saved to the queue');
      setCaption(''); setCaptionTouched(false); setContentId(''); setAdId(''); setScheduleAt('');
      await load();
      setTab('queue');
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const autoGenerate = async () => {
    if (platforms.length === 0) { toast.error('Pick the platforms to generate for'); return; }
    setGenerating(true);
    try {
      const result = await generateTodaysPosts(platforms);
      if (result.created === 0) toast.info('Nothing new to draft — recent content is already queued.');
      else toast.success(`Generated ${result.created} draft${result.created > 1 ? 's' : ''}${result.skipped > 0 ? ` (${result.skipped} already queued)` : ''}`);
      await load();
      if (result.created > 0) setTab('queue');
    } catch (e) { toast.error((e as Error).message); } finally { setGenerating(false); }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await withBusy(deleting.id, async () => {
      try {
        await deleteSocialPost(deleting.id);
        toast.success('Post removed from the queue');
        setDeleting(null);
        await load();
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  const counts = useMemo(() => ({
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    posted: posts.filter((p) => p.status === 'posted').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  }), [posts]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Drafts" value={counts.draft} accent="text-vgold" />
        <StatCard label="Scheduled" value={counts.scheduled} accent="text-blue-400" />
        <StatCard label="Posted" value={counts.posted} accent="text-green-400" />
        <StatCard label="Failed" value={counts.failed} accent={counts.failed > 0 ? 'text-red-400' : 'text-white'} />
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-white/85 leading-relaxed">
          Posts are composed and queued here. Publishing to Facebook, Instagram, X and YouTube runs server-side and
          stays behind explicit approval — nothing on this screen sends anything to an external platform.
        </p>
      </div>

      <Tabs<Tab>
        tabs={[
          { key: 'compose', label: 'Create Post' },
          { key: 'queue', label: 'Post Queue', count: posts.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'compose' ? (
        <div className="space-y-4 max-w-2xl">
          <div className="p-4 rounded-xl glass space-y-3.5">
            <Field label="Content" hint="Pulls the title and blurb into the caption.">
              <SelectInput
                value={contentId}
                onChange={(e) => { setContentId(e.target.value); setCaptionTouched(false); }}
              >
                <option value="">No linked content (free-form post)</option>
                {content.map((c) => (
                  <option key={c.id} value={c.id}>[{c.type}] {c.title}</option>
                ))}
              </SelectInput>
            </Field>

            <Field label="Platforms" required>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`px-3.5 py-2 rounded-full text-[11px] font-bold transition active:scale-95 ${
                      platforms.includes(p) ? 'bg-vred text-white' : 'glass text-vmuted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Sponsor ad to embed" hint="Only creatives on currently Active campaigns are listed.">
              <SelectInput value={adId} onChange={(e) => { setAdId(e.target.value); setCaptionTouched(false); }}>
                <option value="">No sponsor embed</option>
                {ads.map((a) => <option key={a.id} value={a.id}>{a.sponsor} — {a.headline}</option>)}
              </SelectInput>
              {ads.length === 0 && (
                <p className="text-[10px] text-vgold mt-1 flex items-center gap-1">
                  <Megaphone size={10} /> No active campaigns have creatives yet.
                </p>
              )}
            </Field>

            <Field label="Caption" required counter={`${caption.length} chars`}>
              <TextArea
                rows={7}
                value={caption}
                onChange={(e) => { setCaption(e.target.value); setCaptionTouched(true); }}
                placeholder="Auto-generated from the selected content — edit freely."
              />
              {selected && captionTouched && (
                <button
                  onClick={() => { setCaption(buildCaption(selected, selectedAd?.sponsor)); setCaptionTouched(false); }}
                  className="mt-1.5 text-[10px] text-vgold font-bold flex items-center gap-1"
                >
                  <Wand2 size={10} /> Regenerate from content
                </button>
              )}
            </Field>

            <Field label="Schedule for" hint="Leave empty to save as a draft.">
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass">
                <Calendar size={14} className="text-vmuted" />
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none"
                />
              </div>
            </Field>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setPreviewing(true)}
                disabled={!caption.trim()}
                className="px-4 py-3 rounded-full glass text-white text-xs font-bold active:scale-95 disabled:opacity-40"
              >
                Preview
              </button>
              <button
                onClick={() => submit('draft')}
                disabled={saving}
                className="flex-1 py-3 rounded-full glass text-white text-xs font-bold active:scale-95 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => submit('scheduled')}
                disabled={saving}
                className="flex-1 py-3 rounded-full bg-vred text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Send size={13} /> Schedule
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl glass">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles size={15} className="text-vgold" /> Auto-Generate
            </h3>
            <p className="text-[11px] text-vmuted mb-3">
              Drafts one post for each of the five most recent published items, pairing each with a rotating
              active-campaign creative. Everything lands as a draft for review.
            </p>
            <button
              onClick={autoGenerate}
              disabled={generating}
              className="w-full py-2.5 rounded-full bg-vgold text-black text-xs font-bold active:scale-95 disabled:opacity-50"
            >
              {generating ? 'Generating...' : "Generate Today's Posts"}
            </button>
          </div>
        </div>
      ) : loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : posts.length === 0 ? (
        <EmptyState title="The queue is empty" hint="Compose a post or use Auto-Generate." />
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="p-3.5 rounded-xl glass flex items-start gap-3">
              <StatusPill status={p.status} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white line-clamp-2 whitespace-pre-line">{p.caption}</p>
                <div className="text-[10px] text-vmuted mt-1.5 flex items-center gap-2 flex-wrap">
                  <span>{p.platforms.join(', ') || 'no platforms'}</span>
                  {p.contentType && <span>· {p.contentType}</span>}
                  {p.embeddedAdHeadline && <span className="text-vgold">· ad: {p.embeddedAdHeadline}</span>}
                  {p.scheduledAt && <span className="text-blue-400">· scheduled {p.scheduledAt}</span>}
                  {p.postedAt && <span className="text-green-400">· posted {p.postedAt}</span>}
                  <span>· created {p.created}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <IconButton onClick={() => setEditing(p)} title="Edit / reschedule"><Pencil size={14} /></IconButton>
                <IconButton onClick={() => setDeleting(p)} title="Delete" danger disabled={isBusy(p.id)}><Trash2 size={14} /></IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewing && (
        <AdminModal title="Post Preview" subtitle={platforms.join(', ')} onClose={() => setPreviewing(false)}>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-vred flex items-center justify-center text-white font-black text-xs">V</div>
              <div>
                <div className="text-xs font-bold text-white">Vallavan</div>
                <div className="text-[10px] text-vmuted">{scheduleAt ? new Date(scheduleAt).toLocaleString('en-IN') : 'Draft'}</div>
              </div>
            </div>
            <p className="text-sm text-white/90 whitespace-pre-line">{caption}</p>
            {selectedAd && (
              <div className="mt-3 p-2.5 rounded-lg bg-vgold/10 border border-vgold/25">
                <div className="text-[9px] uppercase tracking-wider text-vgold font-bold">Sponsored embed</div>
                <div className="text-xs text-white mt-0.5">{selectedAd.sponsor} — {selectedAd.headline}</div>
              </div>
            )}
          </div>
        </AdminModal>
      )}

      {editing && (
        <EditPostModal
          post={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await load(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete queued post?"
          message="This removes the post from the queue. Nothing was published."
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isBusy(deleting.id)}
        />
      )}
    </div>
  );
}

function EditPostModal({
  post, onClose, onSaved,
}: { post: SocialPostRow; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [caption, setCaption] = useState(post.caption);
  const [platforms, setPlatforms] = useState<string[]>(post.platforms);
  const [status, setStatus] = useState(post.status);
  const [scheduleAt, setScheduleAt] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!caption.trim()) { toast.error('Caption is required'); return; }
    setSaving(true);
    try {
      await updateSocialPost(post.id, {
        caption: caption.trim(),
        platforms,
        status,
        scheduledAt: status === 'scheduled' && scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
      });
      toast.success('Post updated');
      await onSaved();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title="Edit Queued Post"
      subtitle={post.created}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} />}
    >
      <Field label="Caption" required counter={`${caption.length} chars`}>
        <TextArea rows={7} value={caption} onChange={(e) => setCaption(e.target.value)} />
      </Field>
      <Field label="Platforms">
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatforms((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${platforms.includes(p) ? 'bg-vred text-white' : 'glass text-vmuted'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Status">
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          {['draft', 'scheduled', 'posted', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </Field>
      {status === 'scheduled' && (
        <Field label="Reschedule for" hint={post.scheduledAt ? `Currently ${post.scheduledAt}` : undefined}>
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass">
            <Calendar size={14} className="text-vmuted" />
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none"
            />
          </div>
        </Field>
      )}
    </AdminModal>
  );
}
