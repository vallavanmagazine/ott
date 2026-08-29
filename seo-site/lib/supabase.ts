import { createClient } from '@supabase/supabase-js';

// Placeholder fallbacks keep createClient from throwing during `next build`
// when env is absent; live data requires the real anon key at runtime.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  { auth: { persistSession: false } },
);

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vallavan.in';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.vallavan.in';

export interface Doc {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  poster: string;
  backdrop: string;
  year: number;
  duration_sec: number;
  language: string;
}

/** feed_reels — short vertical video. Note `thumb`, not `poster`/`backdrop`. */
export interface Reel {
  id: string;
  title: string;
  caption: string;
  thumb: string;
  creator: string;
  genre: string;
  duration_sec: number;
  created_at: string;
}

/** inspire_items — short motivational clips. Image column is `poster`. */
export interface InspireItem {
  id: string;
  title: string;
  quote: string | null;
  attribution: string | null;
  poster: string;
  category: string;
  duration_sec: number;
  created_at: string;
}

/**
 * live_slots — scheduled programming. Two things differ from every other
 * content table: duration is in MINUTES (`duration_min`), and there is no
 * `status` column at all, so published-state filtering does not apply.
 */
export interface LiveSlot {
  id: string;
  title: string;
  description: string;
  thumb: string;
  start_time24: string;
  duration_min: number;
  air_date: string;
}

/**
 * Resolve an image column to an absolute URL.
 *
 * These columns hold either a full URL or a bare Pexels photo id — the admin
 * forms accept both, and the documentary form even defaults `poster` to the
 * bare id '20212135' when left blank. The SPA has always normalised this via
 * pexelsUrl(); og:image needs an absolute URL or the share preview silently
 * renders with no image, so the same rule is applied here.
 */
export function imageUrl(value: string | null | undefined, w = 1280): string {
  const v = (value ?? '').trim();
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  const id = v.replace(/^img\//, '');
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;
}
