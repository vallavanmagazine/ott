/**
 * Documentaries service
 * Returns data shaped exactly as Documentary[] from mockData.ts
 * Falls back to mock data if Supabase is not configured
 */
import { supabase } from '@/lib/supabase';
import { formatDuration, formatDate } from '@/lib/transforms';
import {
  documentaries as mockDocumentaries,
  type Documentary,
} from '@/data/mockData';

/** Transform a Supabase row to the Documentary interface */
function rowToDocumentary(row: any): Documentary {
  return {
    id: row.id,
    title: row.title,
    titleTa: row.title_ta,
    genre: row.genre,
    duration: formatDuration(row.duration_sec),
    durationSec: row.duration_sec,
    poster: row.poster,
    backdrop: row.backdrop,
    year: row.year,
    language: row.language,
    synopsis: row.synopsis,
    synopsisTa: row.synopsis_ta,
    badge: row.badge || undefined,
    progress: row.progress ?? undefined,
    exclusive: row.exclusive || undefined,
    director: row.director || undefined,
    cast: row.cast?.length ? row.cast : undefined,
    videoUrl: row.video_url || undefined,
  };
}

/** Fetch all published documentaries */
export async function fetchDocumentaries(): Promise<Documentary[]> {
  if (!supabase) return mockDocumentaries;

  const { data, error } = await supabase
    .from('documentaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('fetchDocumentaries fallback to mock:', error?.message);
    return mockDocumentaries;
  }

  return data.map(rowToDocumentary);
}

/** Fetch a single documentary by ID */
export async function fetchDocumentaryById(id: string): Promise<Documentary | null> {
  if (!supabase) return mockDocumentaries.find((d) => d.id === id) || null;

  const { data, error } = await supabase
    .from('documentaries')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToDocumentary(data);
}

/** Fetch documentaries by genre */
export async function fetchDocumentariesByGenre(genre: string): Promise<Documentary[]> {
  if (!supabase) return mockDocumentaries.filter((d) => d.genre === genre);

  const { data, error } = await supabase
    .from('documentaries')
    .select('*')
    .eq('genre', genre)
    .order('created_at', { ascending: false });

  if (error || !data) return mockDocumentaries.filter((d) => d.genre === genre);
  return data.map(rowToDocumentary);
}

/** Fetch featured documentaries (badge = 'FEATURED' or 'NEW') */
export async function fetchFeaturedDocumentaries(): Promise<Documentary[]> {
  if (!supabase) return mockDocumentaries.filter((d) => d.badge);

  const { data, error } = await supabase
    .from('documentaries')
    .select('*')
    .not('badge', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !data) return mockDocumentaries.filter((d) => d.badge);
  return data.map(rowToDocumentary);
}

/** Fetch related documentaries (same genre, excluding current) */
export async function fetchRelatedDocumentaries(
  genre: string,
  excludeId: string,
  limit = 5
): Promise<Documentary[]> {
  if (!supabase) {
    return mockDocumentaries
      .filter((d) => d.genre === genre && d.id !== excludeId)
      .slice(0, limit);
  }

  const { data, error } = await supabase
    .from('documentaries')
    .select('*')
    .eq('genre', genre)
    .neq('id', excludeId)
    .limit(limit);

  if (error || !data) {
    return mockDocumentaries
      .filter((d) => d.genre === genre && d.id !== excludeId)
      .slice(0, limit);
  }
  return data.map(rowToDocumentary);
}

/**
 * Admin view of the documentary library: the viewer shape plus publish status,
 * view count and upload date, so one query drives the whole admin table and its
 * edit form (the viewer fetch drops those fields).
 */
export interface AdminDocumentary extends Documentary {
  status: 'Published' | 'Draft';
  views: number;
  uploaded: string;
  sortOrder: number;
}

export async function fetchAdminDocumentaryRows(): Promise<AdminDocumentary[]> {
  if (!supabase) {
    return mockDocumentaries.map((d, i) => ({
      ...d, status: 'Published' as const, views: 0, uploaded: '—', sortOrder: i,
    }));
  }

  const { data, error } = await supabase
    .from('documentaries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((row) => ({
    ...rowToDocumentary(row),
    status: row.status === 'Draft' ? 'Draft' : 'Published',
    views: row.views ?? 0,
    uploaded: row.created_at ? formatDate(row.created_at) : '—',
    sortOrder: row.sort_order ?? 0,
  }));
}
