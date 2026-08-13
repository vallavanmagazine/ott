/**
 * Inspire service — returns InspireItem[] shaped exactly as mockData.ts
 */
import { supabase } from '@/lib/supabase';
import { formatDuration } from '@/lib/transforms';
import {
  inspireItems as mockInspireItems,
  type InspireItem,
} from '@/data/mockData';

function rowToInspireItem(row: any): InspireItem {
  return {
    id: row.id,
    title: row.title,
    titleTa: row.title_ta,
    category: row.category,
    duration: formatDuration(row.duration_sec),
    poster: row.poster,
    quote: row.quote || undefined,
    attribution: row.attribution || undefined,
    badge: row.badge || undefined,
    videoUrl: row.video_url || undefined,
  };
}

export async function fetchInspireItems(): Promise<InspireItem[]> {
  if (!supabase) return mockInspireItems;

  const { data, error } = await supabase
    .from('inspire_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('fetchInspireItems fallback to mock:', error?.message);
    return mockInspireItems;
  }

  return data.map(rowToInspireItem);
}

export async function fetchInspireItemsByCategory(category: string): Promise<InspireItem[]> {
  if (!supabase) {
    return category === 'All'
      ? mockInspireItems
      : mockInspireItems.filter((i) => i.category === category);
  }

  let query = supabase.from('inspire_items').select('*');
  if (category !== 'All') query = query.eq('category', category);
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return category === 'All'
      ? mockInspireItems
      : mockInspireItems.filter((i) => i.category === category);
  }

  return data.map(rowToInspireItem);
}
