/**
 * Live schedule service — returns LiveSlot[] shaped exactly as mockData.ts
 */
import { supabase } from '@/lib/supabase';
import {
  liveSchedule as mockLiveSchedule,
  type LiveSlot,
} from '@/data/mockData';

function rowToLiveSlot(row: any): LiveSlot {
  return {
    id: row.id,
    time: row.time_display,
    time24: row.time_24,
    title: row.title,
    titleTa: row.title_ta,
    duration: row.duration_display,
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
