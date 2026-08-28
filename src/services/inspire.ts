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

/**
 * Admin view of Inspire: the viewer shape plus publish status, sort order and
 * the sponsorship fields (Inspire items can be sponsor-funded productions).
 */
export interface AdminInspireItem extends InspireItem {
  durationSec: number;
  status: 'Published' | 'Draft';
  isSponsored: boolean;
  sponsorId: string | null;
  sponsorName: string;
  sponsorLogoUrl: string;
  sortOrder: number;
}

export async function fetchAdminInspireItems(): Promise<AdminInspireItem[]> {
  if (!supabase) {
    return mockInspireItems.map((i, idx) => ({
      ...i,
      durationSec: 180,
      status: 'Published' as const,
      isSponsored: false,
      sponsorId: null,
      sponsorName: '',
      sponsorLogoUrl: '',
      sortOrder: idx,
    }));
  }

  const { data, error } = await supabase
    .from('inspire_items')
    .select('*, sponsor:sponsors(name)')
    .order('sort_order', { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((row) => ({
    ...rowToInspireItem(row),
    durationSec: row.duration_sec ?? 180,
    status: row.status === 'Draft' ? 'Draft' : 'Published',
    isSponsored: row.is_sponsored === true,
    sponsorId: row.sponsor_id ?? null,
    sponsorName: row.sponsor?.name ?? '',
    sponsorLogoUrl: row.sponsor_logo_url ?? '',
    sortOrder: row.sort_order ?? 0,
  }));
}
