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
