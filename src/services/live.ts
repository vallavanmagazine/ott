/**
 * Live schedule service — returns LiveSlot[] shaped exactly as mockData.ts
 */
import { supabase } from '@/lib/supabase';
import { format12Hour, formatMinutes } from '@/lib/transforms';
import {
  liveSchedule as mockLiveSchedule,
  type LiveSlot,
} from '@/data/mockData';

function rowToLiveSlot(row: any): LiveSlot {
  return {
    id: row.id,
    time: format12Hour(row.start_time24),   // "06:00 PM" derived from start_time24
    time24: row.start_time24,
    title: row.title,
    titleTa: row.title_ta,
    duration: formatMinutes(row.duration_min), // "30 min" derived from duration_min
    thumb: row.thumb,
    isLive: row.is_live || undefined,
    description: row.description,
  };
}

export async function fetchLiveSchedule(): Promise<LiveSlot[]> {
  if (!supabase) return mockLiveSchedule;

  const { data, error } = await supabase
    .from('live_slots')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.warn('fetchLiveSchedule fallback to mock:', error?.message);
    return mockLiveSchedule;
  }

  return data.map(rowToLiveSlot);
}

/**
 * Admin view of the playout schedule. Carries the raw scheduling fields the
 * viewer shape drops (air date, playout URL, ad-break length, sort order) so
 * an edit form can be prefilled and the timeline can compute gaps.
 */
export interface AdminLiveSlot {
  id: string;
  title: string;
  titleTa: string;
  description: string;
  thumb: string;
  /** "18:00" */
  startTime24: string;
  /** "06:00 PM" */
  startTime12: string;
  durationMin: number;
  isLive: boolean;
  videoUrl: string;
  breakAfterSec: number;
  airDate: string;
  sortOrder: number;
  /** Minutes past midnight — the timeline's x-axis. */
  startMinutes: number;
}

function toMinutes(time24: string): number {
  const [h, m] = (time24 ?? '00:00').split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export async function fetchAdminLiveSlots(airDate?: string): Promise<AdminLiveSlot[]> {
  if (!supabase) {
    return mockLiveSchedule.map((s, i) => ({
      id: s.id,
      title: s.title,
      titleTa: s.titleTa,
      description: s.description,
      thumb: s.thumb,
      startTime24: s.time24,
      startTime12: s.time,
      durationMin: parseInt(s.duration, 10) || 30,
      isLive: !!s.isLive,
      videoUrl: '',
      breakAfterSec: 60,
      airDate: new Date().toISOString().slice(0, 10),
      sortOrder: i,
      startMinutes: toMinutes(s.time24),
    }));
  }

  let query = supabase.from('live_slots').select('*');
  if (airDate) query = query.eq('air_date', airDate);
  const { data, error } = await query.order('start_time24', { ascending: true });
  if (error || !data) return [];

  return (data as any[]).map((row) => ({
    id: row.id,
    title: row.title,
    titleTa: row.title_ta ?? '',
    description: row.description ?? '',
    thumb: row.thumb ?? '',
    startTime24: row.start_time24 ?? '00:00',
    startTime12: format12Hour(row.start_time24 ?? '00:00'),
    durationMin: row.duration_min ?? 30,
    isLive: row.is_live === true,
    videoUrl: row.video_url ?? '',
    breakAfterSec: row.break_after_sec ?? 60,
    airDate: row.air_date ?? '',
    sortOrder: row.sort_order ?? 0,
    startMinutes: toMinutes(row.start_time24 ?? '00:00'),
  }));
}

/** Distinct air dates that have at least one slot, newest first. */
export async function fetchAirDates(): Promise<string[]> {
  if (!supabase) return [new Date().toISOString().slice(0, 10)];
  const { data } = await supabase.from('live_slots').select('air_date').order('air_date', { ascending: false });
  const seen = new Set<string>();
  for (const r of (data ?? []) as any[]) if (r.air_date) seen.add(r.air_date);
  const today = new Date().toISOString().slice(0, 10);
  seen.add(today);
  return [...seen].sort().reverse();
}
