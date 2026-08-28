/**
 * Ad Management — placements (where ads run) and creatives (what viewers see),
 * plus the geo-targeting readout.
 *
 * Geo automation lives in services/ad-engine.ts and works off a cascade:
 * district-targeted active campaigns first, then statewide campaigns (empty
 * target_districts), then any creative, then the Vallavan house ad. Rotation
 * inside a tier is least-impressions-first. This screen surfaces the inputs to
 * that cascade (a campaign's target districts) next to its outputs (impressions
 * actually served per district, from ad_events) so a mis-targeted campaign is
 * visible rather than silent.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, Pause, Play, Eye, MapPin, Pencil, Trash2, Plus, Building2 } from 'lucide-react';
import {
  fetchAdCreatives, fetchAdPlacements, fetchAdDistrictStats,
  type AdCreativeRow, type AdPlacementRow,
} from '@/services/admin-ads';
import type { DistrictStat } from '@/services/admin-campaigns';
import { fetchSponsorOptions, fetchCampaignOptions } from '@/services/admin-campaigns';
import {
  pauseAdPlacement, resumeAdPlacement, createAd, updateAd, deleteAd,
  createAdPlacement, deleteAdPlacement,
} from '@/services/admin-writes';
import { pexelsUrl } from '@/data/mockData';
import { useToast } from '@/components/admin/Toast';
import { AD_PLACEMENT_SLOTS, compactCount } from '@/lib/admin-options';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea, SelectInput,
  SearchInput, StatusPill, StatCard, SkeletonTable, EmptyState, IconButton,
  Tabs, useBusy,
} from '@/components/admin/ui';

type Tab = 'placements' | 'creatives';

interface CreativeForm {
  sponsor: string;
  sponsorId: string;
  sponsorLogo: string;
  headline: string;
  body: string;
  cta: string;
  bgImage: string;
  accent: string;
  campaignId: string;
}

const BLANK_CREATIVE: CreativeForm = {
  sponsor: '', sponsorId: '', sponsorLogo: '', headline: '', body: '',
  cta: 'Learn More', bgImage: '30004134', accent: '#D32F2F', campaignId: '',
};

export function AdminAdManagement() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [tab, setTab] = useState<Tab>('placements');
  const [placements, setPlacements] = useState<AdPlacementRow[]>([]);
  const [creatives, setCreatives] = useState<AdCreativeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [sponsors, setSponsors] = useState<{ id: string; name: string }[]>([]);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  const [previewing, setPreviewing] = useState<AdCreativeRow | null>(null);
  const [editing, setEditing] = useState<AdCreativeRow | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdCreativeRow | null>(null);
  const [addingPlacement, setAddingPlacement] = useState(false);
  const [deletingPlacement, setDeletingPlacement] = useState<AdPlacementRow | null>(null);

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([fetchAdPlacements(), fetchAdCreatives()]);
    setPlacements(p);
    setCreatives(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetchSponsorOptions().then(setSponsors).catch(() => {});
    fetchCampaignOptions().then(setCampaigns).catch(() => {});
  }, [load]);

  const filteredPlacements = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return placements;
    return placements.filter((p) =>
      p.sponsor.toLowerCase().includes(q) || p.placement.toLowerCase().includes(q) || p.headline.toLowerCase().includes(q));
  }, [placements, query]);

  const filteredCreatives = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return creatives;
    return creatives.filter((c) =>
      c.sponsor.toLowerCase().includes(q) || c.headline.toLowerCase().includes(q) || c.campaignName.toLowerCase().includes(q));
  }, [creatives, query]);

  const togglePlacement = (p: AdPlacementRow) => withBusy(p.id, async () => {
    try {
      if (p.status === 'Paused') {
        await resumeAdPlacement(p.id, p.placement);
        toast.success(`Resumed ${p.placement}`);
      } else {
        await pauseAdPlacement(p.id, p.placement);
        toast.success(`Paused ${p.placement}`);
      }
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  const saveCreative = async (form: CreativeForm) => {
    const payload = {
      sponsor: form.sponsor.trim(),
      sponsorId: form.sponsorId || null,
      sponsorLogo: form.sponsorLogo.trim(),
      headline: form.headline.trim(),
      body: form.body.trim(),
      cta: form.cta.trim() || 'Learn More',
      bgImage: form.bgImage.trim() || '30004134',
      accent: form.accent || '#D32F2F',
      campaignId: form.campaignId || null,
    };
    if (editing === 'new') {
      await createAd(payload);
      toast.success(`Creative "${payload.headline}" created`);
    } else if (editing) {
      await updateAd(editing.id, payload);
      toast.success(`Creative "${payload.headline}" updated`);
    }
    setEditing(null);
    await load();
  };

  const confirmDeleteCreative = async () => {
    if (!deleting) return;
    await withBusy(deleting.id, async () => {
      try {
        await deleteAd(deleting.id, deleting.headline);
        toast.success('Creative deleted');
        setDeleting(null);
        await load();
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  const confirmDeletePlacement = async () => {
    if (!deletingPlacement) return;
    await withBusy(deletingPlacement.id, async () => {
      try {
        await deleteAdPlacement(deletingPlacement.id, deletingPlacement.placement);
        toast.success('Placement removed');
        setDeletingPlacement(null);
        await load();
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  const livePlacements = placements.filter((p) => p.status !== 'Paused').length;
  const totalImpressions = placements.reduce((s, p) => s + p.impressions, 0);
  const activeSponsors = new Set(placements.map((p) => p.sponsor)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Live Placements" value={livePlacements} icon={<Megaphone size={13} />} />
        <StatCard label="Total Impressions" value={compactCount(totalImpressions)} accent="text-vgold" />
        <StatCard label="Creatives" value={creatives.length} accent="text-blue-400" />
        <StatCard label="Active Sponsors" value={activeSponsors} accent="text-green-400" />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Tabs<Tab>
          tabs={[
            { key: 'placements', label: 'Placements', count: placements.length },
            { key: 'creatives', label: 'Creatives', count: creatives.length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search sponsor, headline or slot..." />
        <button
          onClick={() => (tab === 'creatives' ? setEditing('new') : setAddingPlacement(true))}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={16} /> {tab === 'creatives' ? 'New Creative' : 'New Placement'}
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : tab === 'placements' ? (
        filteredPlacements.length === 0 ? (
          <EmptyState title="No ad placements" hint="A placement points a creative at a slot (pre-roll, feed strip, live break)." />
        ) : (
          <div className="rounded-xl glass overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                  <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                  <th className="text-left px-4 py-3 font-bold">Creative</th>
                  <th className="text-left px-4 py-3 font-bold">Placement</th>
                  <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Campaign</th>
                  <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Targeting</th>
                  <th className="text-left px-4 py-3 font-bold">Impressions</th>
                  <th className="text-left px-4 py-3 font-bold">Status</th>
                  <th className="text-right px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPlacements.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-semibold text-white">{p.sponsor}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.bgImage && (
                          <div className="w-10 h-7 rounded overflow-hidden bg-white/5 flex-shrink-0">
                            <img src={pexelsUrl(p.bgImage, 120)} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-white/80 text-[12px] truncate max-w-[160px]">{p.headline}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-vmuted">{p.placement}</td>
                    <td className="px-4 py-3 text-vmuted hidden md:table-cell">{p.campaignName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <GeoBadge districts={p.targetDistricts} />
                    </td>
                    <td className="px-4 py-3 text-vgold font-bold tabular-nums">{p.impressions.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePlacement(p)}
                          disabled={isBusy(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 disabled:opacity-50 flex items-center gap-1 ${
                            p.status === 'Paused'
                              ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                              : 'bg-vgold/15 text-vgold hover:bg-vgold/25'
                          }`}
                        >
                          {p.status === 'Paused' ? <><Play size={11} /> Resume</> : <><Pause size={11} /> Pause</>}
                        </button>
                        <IconButton onClick={() => setDeletingPlacement(p)} title="Remove placement" danger><Trash2 size={14} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : filteredCreatives.length === 0 ? (
        <EmptyState title="No ad creatives" hint="Create one, then add a placement to put it on air." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredCreatives.map((c) => (
            <div key={c.id} className="p-3.5 rounded-xl glass">
              <div className="flex gap-3">
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  <img src={pexelsUrl(c.bgImage, 240)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.accent }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-vgold truncate">{c.sponsor}</span>
                  </div>
                  <div className="text-sm font-bold text-white truncate mt-0.5">{c.headline}</div>
                  <div className="text-[11px] text-vmuted line-clamp-2">{c.body}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-vmuted">Campaign: {c.campaignName}</span>
                    {c.campaignStatus !== '—' && <StatusPill status={c.campaignStatus} />}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <GeoBadge districts={c.targetDistricts} />
                <div className="flex items-center gap-1">
                  <IconButton onClick={() => setPreviewing(c)} title="Preview + geo breakdown"><Eye size={14} /></IconButton>
                  <IconButton onClick={() => setEditing(c)} title="Edit creative"><Pencil size={14} /></IconButton>
                  <IconButton onClick={() => setDeleting(c)} title="Delete creative" danger><Trash2 size={14} /></IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewing && <CreativePreviewModal creative={previewing} onClose={() => setPreviewing(null)} />}

      {editing && (
        <CreativeFormModal
          initial={editing === 'new' ? BLANK_CREATIVE : {
            sponsor: editing.sponsor,
            sponsorId: editing.sponsorId ?? '',
            sponsorLogo: editing.sponsorLogo,
            headline: editing.headline,
            body: editing.body,
            cta: editing.cta,
            bgImage: editing.bgImage,
            accent: editing.accent,
            campaignId: editing.campaignId ?? '',
          }}
          isNew={editing === 'new'}
          sponsors={sponsors}
          campaigns={campaigns}
          onClose={() => setEditing(null)}
          onSave={saveCreative}
        />
      )}

      {addingPlacement && (
        <PlacementFormModal
          creatives={creatives}
          onClose={() => setAddingPlacement(false)}
          onSave={async (input) => {
            await createAdPlacement(input);
            toast.success(`Placement "${input.placement}" created`);
            setAddingPlacement(false);
            await load();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete ad creative?"
          message={`"${deleting.headline}" will be removed. Placements referencing it keep running but lose their creative.`}
          onConfirm={confirmDeleteCreative}
          onCancel={() => setDeleting(null)}
          busy={isBusy(deleting.id)}
        />
      )}

      {deletingPlacement && (
        <ConfirmDialog
          title="Remove placement?"
          message={`"${deletingPlacement.placement}" for ${deletingPlacement.sponsor} will stop serving.`}
          confirmLabel="Remove"
          onConfirm={confirmDeletePlacement}
          onCancel={() => setDeletingPlacement(null)}
          busy={isBusy(deletingPlacement.id)}
        />
      )}
    </div>
  );
}

/** Empty target_districts means statewide — that is the ad engine's tier 2. */
function GeoBadge({ districts }: { districts: string[] }) {
  if (!districts || districts.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">
        <MapPin size={10} /> All Tamil Nadu
      </span>
    );
  }
  return (
    <span
      title={districts.join(', ')}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold"
    >
      <MapPin size={10} /> {districts.length === 1 ? districts[0] : `${districts.length} districts`}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Preview + per-district delivery
// ---------------------------------------------------------------------------
function CreativePreviewModal({ creative, onClose }: { creative: AdCreativeRow; onClose: () => void }) {
  const [stats, setStats] = useState<DistrictStat[] | null>(null);

  useEffect(() => {
    fetchAdDistrictStats(creative.id).then(setStats).catch(() => setStats([]));
  }, [creative.id]);

  const maxImpr = Math.max(1, ...(stats ?? []).map((s) => s.impressions));
  const totals = (stats ?? []).reduce(
    (acc, s) => ({ impressions: acc.impressions + s.impressions, clicks: acc.clicks + s.clicks }),
    { impressions: 0, clicks: 0 },
  );

  return (
    <AdminModal title="Ad Creative" subtitle={creative.sponsor} onClose={onClose} wide>
      {/* Viewer-accurate preview of the creative */}
      <div className="rounded-xl overflow-hidden relative h-44">
        <img src={pexelsUrl(creative.bgImage, 900)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: creative.accent }}>
            Sponsored · {creative.sponsor}
          </div>
          <div className="text-lg font-black text-white leading-tight">{creative.headline}</div>
          <div className="text-xs text-white/70 mt-1 line-clamp-2">{creative.body}</div>
          <button className="mt-2.5 px-4 py-1.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: creative.accent }}>
            {creative.cta}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Impressions" value={totals.impressions.toLocaleString('en-IN')} accent="text-vgold" />
        <StatCard label="Clicks" value={totals.clicks.toLocaleString('en-IN')} accent="text-green-400" />
        <StatCard
          label="CTR"
          value={totals.impressions > 0 ? `${((totals.clicks / totals.impressions) * 100).toFixed(2)}%` : '—'}
          accent="text-blue-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-white">Delivery by District</h4>
          <GeoBadge districts={creative.targetDistricts} />
        </div>
        {stats === null ? (
          <SkeletonTable rows={4} cols={2} />
        ) : stats.length === 0 ? (
          <EmptyState title="No impressions recorded yet" hint="Districts appear here once the ad engine serves this creative." />
        ) : (
          <div className="space-y-1.5">
            {stats.map((s) => (
              <div key={s.district} className="flex items-center gap-3">
                <span className="w-32 text-[11px] text-white/80 truncate flex-shrink-0">{s.district}</span>
                <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-vred to-vgold" style={{ width: `${(s.impressions / maxImpr) * 100}%` }} />
                </div>
                <span className="w-24 text-right text-[10px] text-vmuted tabular-nums flex-shrink-0">
                  {s.impressions.toLocaleString('en-IN')} · {s.clicks} clicks
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-vmuted leading-relaxed">
        Targeting cascade: district-matched active campaigns first, then statewide campaigns, then any creative,
        then the Vallavan house ad. Within a tier the least-shown creative wins, so rotation stays even.
      </p>
    </AdminModal>
  );
}

// ---------------------------------------------------------------------------
// Creative form
// ---------------------------------------------------------------------------
function CreativeFormModal({
  initial, isNew, sponsors, campaigns, onClose, onSave,
}: {
  initial: CreativeForm;
  isNew: boolean;
  sponsors: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
  onClose: () => void;
  onSave: (f: CreativeForm) => Promise<void>;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CreativeForm>(k: K, v: CreativeForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.sponsor.trim()) { toast.error('Sponsor name is required'); return; }
    if (!form.headline.trim()) { toast.error('Headline is required'); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={isNew ? 'New Ad Creative' : 'Edit Ad Creative'}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} />}
    >
      <Field label="Sponsor Account" hint="Links the creative to a sponsor for billing and reporting.">
        <SelectInput
          value={form.sponsorId}
          onChange={(e) => {
            const id = e.target.value;
            const name = sponsors.find((s) => s.id === id)?.name;
            setForm((f) => ({ ...f, sponsorId: id, sponsor: name ?? f.sponsor }));
          }}
        >
          <option value="">Not linked</option>
          {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </SelectInput>
      </Field>

      <Field label="Sponsor display name" required>
        <TextInput value={form.sponsor} onChange={(e) => set('sponsor', e.target.value)} placeholder="Tamil Tea Co." />
      </Field>

      <Field label="Headline" required>
        <TextInput value={form.headline} onChange={(e) => set('headline', e.target.value)} placeholder="Brewed in the Nilgiris" />
      </Field>

      <Field label="Body">
        <TextArea rows={2} value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Supporting line shown under the headline" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Call to action">
          <TextInput value={form.cta} onChange={(e) => set('cta', e.target.value)} placeholder="Learn More" />
        </Field>
        <Field label="Accent colour">
          <div className="flex gap-2">
            <input
              type="color"
              value={form.accent}
              onChange={(e) => set('accent', e.target.value)}
              className="w-11 h-[42px] rounded-xl bg-transparent border border-white/10 cursor-pointer"
            />
            <TextInput value={form.accent} onChange={(e) => set('accent', e.target.value)} />
          </div>
        </Field>
      </div>

      <Field label="Background image" hint="Full image URL, or a Pexels photo id.">
        <div className="flex gap-2">
          <TextInput value={form.bgImage} onChange={(e) => set('bgImage', e.target.value)} placeholder="30004134" />
          {form.bgImage && (
            <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
              <img src={pexelsUrl(form.bgImage, 150)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Field>

      <Field label="Sponsor logo URL">
        <TextInput value={form.sponsorLogo} onChange={(e) => set('sponsorLogo', e.target.value)} placeholder="https://..." />
      </Field>

      <Field label="Campaign" hint="The campaign's target districts drive where this creative is served.">
        <SelectInput value={form.campaignId} onChange={(e) => set('campaignId', e.target.value)}>
          <option value="">No campaign (house / fallback inventory)</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectInput>
      </Field>
    </AdminModal>
  );
}

// ---------------------------------------------------------------------------
// Placement form
// ---------------------------------------------------------------------------
function PlacementFormModal({
  creatives, onClose, onSave,
}: {
  creatives: AdCreativeRow[];
  onClose: () => void;
  onSave: (input: { sponsor: string; adId: string; placement: string; status: string }) => Promise<void>;
}) {
  const toast = useToast();
  const [adId, setAdId] = useState(creatives[0]?.id ?? '');
  const [placement, setPlacement] = useState<string>(AD_PLACEMENT_SLOTS[0]);
  const [status, setStatus] = useState('Live');
  const [saving, setSaving] = useState(false);

  const creative = creatives.find((c) => c.id === adId);

  const submit = async () => {
    if (!adId) { toast.error('Pick a creative first — create one on the Creatives tab.'); return; }
    setSaving(true);
    try {
      await onSave({ sponsor: creative?.sponsor ?? 'Unknown', adId, placement, status });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title="New Ad Placement"
      subtitle="Puts an existing creative into a slot"
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label="Create Placement" />}
    >
      <Field label="Creative" required>
        <SelectInput value={adId} onChange={(e) => setAdId(e.target.value)}>
          {creatives.length === 0 && <option value="">No creatives yet</option>}
          {creatives.map((c) => <option key={c.id} value={c.id}>{c.sponsor} — {c.headline}</option>)}
        </SelectInput>
      </Field>

      {creative && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl glass">
          <Building2 size={14} className="text-vmuted" />
          <span className="text-xs text-white/80 flex-1 truncate">{creative.campaignName}</span>
          <GeoBadge districts={creative.targetDistricts} />
        </div>
      )}

      <Field label="Placement slot" required>
        <SelectInput value={placement} onChange={(e) => setPlacement(e.target.value)}>
          {AD_PLACEMENT_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </Field>

      <Field label="Status">
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Live">Live</option>
          <option value="Paused">Paused</option>
        </SelectInput>
      </Field>
    </AdminModal>
  );
}
