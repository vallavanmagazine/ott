/**
 * Live TV — playout schedule management for VALLAVAN TV.
 *
 * Three things live on this screen:
 *   1. the GO LIVE / GO OFFLINE switch (broadcast_config.channel_live), which
 *      decides whether viewers see the player or the "Coming Soon" promo;
 *   2. a visual day timeline that makes dead air (gaps) and overlaps obvious;
 *   3. full CRUD on `live_slots` for the selected air date.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Tv, Trash2, Pencil, Radio, Clock, AlertTriangle } from 'lucide-react';
import { fetchAdminLiveSlots, fetchAirDates, type AdminLiveSlot } from '@/services/live';
import { createLiveSlot, updateLiveSlot, deleteLiveSlot } from '@/services/admin-writes';
import { fetchBroadcastConfig, updateBroadcastConfig } from '@/services/broadcast';
import { DyneTubeUpload } from '@/components/DyneTubeUpload';
import { pexelsUrl } from '@/data/mockData';
import { useToast } from '@/components/admin/Toast';
import { autoThumbnail, videoKindLabel } from '@/lib/video';
import { format12Hour } from '@/lib/transforms';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea,
  ToggleRow, StatCard, SkeletonTable, EmptyState, IconButton, useBusy,
} from '@/components/admin/ui';

const DAY_MINUTES = 24 * 60;

interface SlotForm {
  title: string;
  titleTa: string;
  description: string;
  thumb: string;
  videoUrl: string;
  startTime24: string;
  durationMin: number;
  airDate: string;
  isLive: boolean;
  breakAfterSec: number;
}

const blankForm = (airDate: string): SlotForm => ({
  title: '',
  titleTa: '',
  description: '',
  thumb: '',
  videoUrl: '',
  startTime24: '18:00',
  durationMin: 30,
  airDate,
  isLive: false,
  breakAfterSec: 60,
});

function formFromSlot(s: AdminLiveSlot): SlotForm {
  return {
    title: s.title,
    titleTa: s.titleTa,
    description: s.description,
    thumb: s.thumb,
    videoUrl: s.videoUrl,
    startTime24: s.startTime24,
    durationMin: s.durationMin,
    airDate: s.airDate || new Date().toISOString().slice(0, 10),
    isLive: s.isLive,
    breakAfterSec: s.breakAfterSec,
  };
}

/** Minutes of dead air before each slot, plus any overlap with the previous one. */
interface TimelineBlock {
  slot: AdminLiveSlot;
  gapBefore: number;
  overlap: number;
}

function buildTimeline(slots: AdminLiveSlot[]): { blocks: TimelineBlock[]; covered: number } {
  const ordered = [...slots].sort((a, b) => a.startMinutes - b.startMinutes);
  const blocks: TimelineBlock[] = [];
  let cursor = 0;
  let covered = 0;

  for (const slot of ordered) {
    const gapBefore = Math.max(0, slot.startMinutes - cursor);
    const overlap = Math.max(0, cursor - slot.startMinutes);
    blocks.push({ slot, gapBefore, overlap });
    covered += slot.durationMin;
    cursor = Math.max(cursor, slot.startMinutes + slot.durationMin);
  }
  return { blocks, covered };
}

function minutesLabel(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function AdminLiveTV() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const today = new Date().toISOString().slice(0, 10);
  const [airDate, setAirDate] = useState(today);
  const [airDates, setAirDates] = useState<string[]>([today]);
  const [slots, setSlots] = useState<AdminLiveSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelLive, setChannelLive] = useState(false);
  const [togglingChannel, setTogglingChannel] = useState(false);

  const [editing, setEditing] = useState<AdminLiveSlot | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminLiveSlot | null>(null);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    const rows = await fetchAdminLiveSlots(date);
    setSlots(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(airDate); }, [airDate, load]);

  useEffect(() => {
    fetchAirDates().then(setAirDates).catch(() => setAirDates([today]));
    fetchBroadcastConfig().then((c) => setChannelLive(c.channel_live)).catch(() => {});
  }, [today]);

  const { blocks, covered } = useMemo(() => buildTimeline(slots), [slots]);
  const gaps = blocks.filter((b) => b.gapBefore > 0).length;
  const overlaps = blocks.filter((b) => b.overlap > 0).length;

  const toggleChannel = async () => {
    const next = !channelLive;
    setTogglingChannel(true);
    setChannelLive(next);
    try {
      await updateBroadcastConfig({ channel_live: next });
      toast.success(next ? 'VALLAVAN TV is LIVE' : 'Channel is offline — viewers see the promo screen');
    } catch (e) {
      setChannelLive(!next);
      toast.error((e as Error).message);
    } finally {
      setTogglingChannel(false);
    }
  };

  const save = async (form: SlotForm) => {
    const payload = {
      title: form.title.trim(),
      titleTa: form.titleTa.trim() || form.title.trim(),
      description: form.description.trim(),
      thumb: form.thumb.trim() || autoThumbnail(form.videoUrl) || '30004134',
      startTime24: form.startTime24,
      durationMin: Number(form.durationMin) || 30,
      videoUrl: form.videoUrl.trim() || null,
      isLive: form.isLive,
      airDate: form.airDate,
      breakAfterSec: Number(form.breakAfterSec) || 0,
    };

    if (editing === 'new') {
      await createLiveSlot({ ...payload, sortOrder: slots.length });
      toast.success(`"${payload.title}" added to the ${form.airDate} schedule`);
    } else if (editing) {
      await updateLiveSlot(editing.id, payload);
      toast.success(`"${payload.title}" updated`);
    }
    setEditing(null);
    if (form.airDate !== airDate) setAirDate(form.airDate);
    else await load(airDate);
    fetchAirDates().then(setAirDates).catch(() => {});
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await withBusy(deleting.id, async () => {
      try {
        await deleteLiveSlot(deleting.id, deleting.title);
        toast.success(`Removed "${deleting.title}" from the schedule`);
        setDeleting(null);
        await load(airDate);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Channel go-live switch */}
      <div className={`p-4 rounded-xl border ${channelLive ? 'bg-vred/10 border-vred/40' : 'bg-vgold/10 border-vgold/30'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${channelLive ? 'bg-vred' : 'bg-vgold'}`}>
              {channelLive ? <Radio size={20} className="text-white" /> : <Tv size={20} className="text-black" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white">VALLAVAN TV</h3>
              <p className="text-[11px] text-vmuted">
                {channelLive
                  ? 'On air — viewers see the live player and broadcast overlay.'
                  : 'Coming Soon mode — viewers see the promo screen.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleChannel}
            disabled={togglingChannel}
            className={`px-5 py-2.5 rounded-full text-xs font-black active:scale-95 transition disabled:opacity-50 flex-shrink-0 ${
              channelLive ? 'bg-vred text-white' : 'bg-vgold text-black'
            }`}
          >
            {channelLive ? 'GO OFFLINE' : 'GO LIVE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Programs" value={slots.length} icon={<Tv size={13} />} />
        <StatCard label="Airtime Filled" value={minutesLabel(covered)} accent="text-green-400" icon={<Clock size={13} />} />
        <StatCard label="Schedule Gaps" value={gaps} accent={gaps > 0 ? 'text-vgold' : 'text-white'} />
        <StatCard label="Overlaps" value={overlaps} accent={overlaps > 0 ? 'text-red-400' : 'text-white'} />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass">
          <span className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Air date</span>
          <input
            type="date"
            value={airDate}
            onChange={(e) => setAirDate(e.target.value)}
            className="bg-transparent text-sm text-white outline-none"
          />
        </div>
        <select
          value={airDate}
          onChange={(e) => setAirDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
        >
          {airDates.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => setEditing('new')}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <Plus size={16} /> Add Slot
        </button>
      </div>

      {/* Day timeline — proportional bars over a 24h axis */}
      {!loading && slots.length > 0 && (
        <div className="p-4 rounded-xl glass">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Day Timeline</h3>
            <span className="text-[10px] text-vmuted">{minutesLabel(DAY_MINUTES - covered)} unscheduled</span>
          </div>
          <div className="relative h-9 rounded-lg bg-white/5 overflow-hidden">
            {slots.map((s) => (
              <div
                key={s.id}
                title={`${s.startTime12} · ${s.title} · ${s.durationMin} min`}
                onClick={() => setEditing(s)}
                className={`absolute top-0 h-full cursor-pointer border-r border-black/40 ${s.isLive ? 'bg-vred' : 'bg-vgold/70'}`}
                style={{
                  left: `${(s.startMinutes / DAY_MINUTES) * 100}%`,
                  width: `${Math.max(0.4, (s.durationMin / DAY_MINUTES) * 100)}%`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] text-vmuted tabular-nums">
            {['00:00', '06:00', '12:00', '18:00', '24:00'].map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : slots.length === 0 ? (
        <EmptyState title={`No programs scheduled for ${airDate}`} hint='Click "Add Slot" to build the day.' />
      ) : (
        <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
          {blocks.map(({ slot, gapBefore, overlap }) => (
            <div key={slot.id}>
              {gapBefore > 0 && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-vgold/5 text-[10px] text-vgold">
                  <AlertTriangle size={11} /> {minutesLabel(gapBefore)} of dead air before this program
                </div>
              )}
              {overlap > 0 && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-[10px] text-red-400">
                  <AlertTriangle size={11} /> Overlaps the previous program by {minutesLabel(overlap)}
                </div>
              )}
              <div className="flex items-center gap-4 p-3.5 hover:bg-white/5 transition">
                <div className="w-20 text-center flex-shrink-0">
                  <div className="text-sm font-bold text-white tabular-nums">{slot.startTime12}</div>
                  <div className="text-[10px] text-vmuted">{slot.durationMin} min</div>
                </div>
                <div className="w-14 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 hidden sm:block">
                  {slot.thumb && <img src={pexelsUrl(slot.thumb, 150)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{slot.title}</div>
                  <div className="text-[11px] font-tamil text-vmuted truncate">{slot.titleTa}</div>
                  <div className="text-[10px] text-vmuted mt-0.5 flex items-center gap-2 flex-wrap">
                    {slot.videoUrl ? <span className="text-vgold">{videoKindLabel(slot.videoUrl)}</span> : <span className="text-red-400">No playout URL</span>}
                    <span>Break after: {slot.breakAfterSec}s</span>
                  </div>
                </div>
                {slot.isLive && (
                  <span className="px-2 py-0.5 rounded-full bg-vred text-white text-[10px] font-bold flex-shrink-0">LIVE</span>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <IconButton onClick={() => setEditing(slot)} title="Edit slot"><Pencil size={14} /></IconButton>
                  <IconButton onClick={() => setDeleting(slot)} title="Delete slot" danger disabled={isBusy(slot.id)}><Trash2 size={14} /></IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SlotFormModal
          initial={editing === 'new' ? blankForm(airDate) : formFromSlot(editing)}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete program slot?"
          message={`"${deleting.title}" at ${deleting.startTime12} will be removed from the ${deleting.airDate} schedule.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          busy={isBusy(deleting.id)}
        />
      )}
    </div>
  );
}

function SlotFormModal({
  initial, isNew, onClose, onSave,
}: { initial: SlotForm; isNew: boolean; onClose: () => void; onSave: (f: SlotForm) => Promise<void> }) {
  const toast = useToast();
  const [form, setForm] = useState<SlotForm>(initial);
  const [saving, setSaving] = useState(false);
  const [thumbTouched, setThumbTouched] = useState(!!initial.thumb);

  const set = <K extends keyof SlotForm>(key: K, value: SlotForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onVideoUrl = (url: string) => {
    setForm((f) => {
      const auto = autoThumbnail(url);
      return { ...f, videoUrl: url, thumb: !thumbTouched && auto ? auto : f.thumb };
    });
  };

  const endsAt = useMemo(() => {
    const [h, m] = form.startTime24.split(':').map((n) => parseInt(n, 10) || 0);
    const total = (h * 60 + m + (Number(form.durationMin) || 0)) % DAY_MINUTES;
    return format12Hour(`${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`);
  }, [form.startTime24, form.durationMin]);

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Program title is required'); return; }
    if (!/^\d{2}:\d{2}$/.test(form.startTime24)) { toast.error('Start time must be HH:MM (24h)'); return; }
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
      title={isNew ? 'Add Program Slot' : 'Edit Program Slot'}
      subtitle={isNew ? undefined : form.title}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label={isNew ? 'Add Slot' : 'Save Changes'} />}
    >
      <Field label="Program Title (English)" required>
        <TextInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Evening Documentary Hour" />
      </Field>

      <Field label="Program Title (Tamil)">
        <TextInput className="font-tamil" value={form.titleTa} onChange={(e) => set('titleTa', e.target.value)} placeholder="தலைப்பு" />
      </Field>

      <Field label="Description">
        <TextArea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What airs in this slot..." />
      </Field>

      <Field label="Playout Video URL" hint="HLS (.m3u8) for live playout, or a YouTube / MP4 source">
        <TextInput value={form.videoUrl} onChange={(e) => onVideoUrl(e.target.value)} placeholder="https://.../stream.m3u8" />
        {form.videoUrl && <p className="text-[10px] text-vgold mt-1">Detected: {videoKindLabel(form.videoUrl)}</p>}
      </Field>

      <DyneTubeUpload onUploaded={onVideoUrl} />

      <Field label="Thumbnail URL" hint={autoThumbnail(form.videoUrl) ? 'Auto-filled from the YouTube URL — edit to override.' : 'Full image URL, or a Pexels photo id.'}>
        <TextInput
          value={form.thumb}
          onChange={(e) => { setThumbTouched(true); set('thumb', e.target.value); }}
          placeholder="https://... or 30004134"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Time (24h)" required hint={`Ends ${endsAt}`}>
          <TextInput type="time" value={form.startTime24} onChange={(e) => set('startTime24', e.target.value)} />
        </Field>
        <Field label="Duration (minutes)" required>
          <TextInput type="number" min={1} value={form.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Air Date" required>
          <TextInput type="date" value={form.airDate} onChange={(e) => set('airDate', e.target.value)} />
        </Field>
        <Field label="Ad Break After (seconds)" hint="Break inserted between programs">
          <TextInput type="number" min={0} value={form.breakAfterSec} onChange={(e) => set('breakAfterSec', Number(e.target.value))} />
        </Field>
      </div>

      <ToggleRow
        on={form.isLive}
        onChange={(v) => set('isLive', v)}
        label="Currently Live"
        sub="Marks this slot as the on-air program in the viewer schedule"
      />
    </AdminModal>
  );
}
