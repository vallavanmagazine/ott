/**
 * Search index — real content only, from both tables Search is meant to cover.
 *
 * Two separate defects are addressed here, and only one of them was the Feed
 * bug class:
 *
 *  1. Same as Feed. SearchScreen seeded its state from mockData's
 *     `documentaries` array and called fetchDocumentaries(), which answers any
 *     failure — unconfigured Supabase, RLS refusal, network error — by
 *     returning that same mock array. A broken query therefore searched eleven
 *     fabricated titles and looked like it was working.
 *
 *  2. Bigger, and specific to Search. It only ever queried `documentaries`.
 *     `feed_reels` was not in the index at all, so no reel could be found by
 *     any term — "tsunami" included — no matter how healthy the query was.
 *
 * Reels are projected into the Documentary interface rather than the results
 * grid being taught a second shape: ContentCard and DocumentaryDetailScreen
 * both take a Documentary, and per CLAUDE.md the service layer is where a
 * shape mismatch gets resolved. `badge: 'REEL'` marks them using an existing
 * ContentCard affordance, so nothing in the UI changes.
 */
import { supabase } from '@/lib/supabase';
import { formatShortDuration } from '@/lib/transforms';
import type { Documentary, Genre } from '@/data/mockData';

function db() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured in this build — VITE_SUPABASE_URL and '
      + 'VITE_SUPABASE_ANON_KEY were missing when it was compiled. Rebuild with a .env present.',
    );
  }
  return supabase;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToDocumentary(row: any): Documentary {
  return {
    id: row.id,
    title: row.title,
    titleTa: row.title_ta,
    genre: row.genre,
    duration: formatShortDuration(row.duration_sec),
    durationSec: row.duration_sec,
    poster: row.poster,
    backdrop: row.backdrop,
    year: row.year,
    language: row.language,
    synopsis: row.synopsis,
    synopsisTa: row.synopsis_ta,
    badge: row.badge || undefined,
    exclusive: row.exclusive || undefined,
    director: row.director || undefined,
    cast: row.cast?.length ? row.cast : undefined,
    videoUrl: row.video_url || undefined,
  };
}

/**
 * A reel wearing the Documentary shape. `thumb` stands in for both poster and
 * backdrop (a reel has one image), the caption becomes the synopsis, and the
 * year comes off created_at since reels carry no year column.
 */
function reelToDocumentary(row: any): Documentary {
  return {
    id: row.id,
    title: row.title,
    titleTa: row.title_ta,
    genre: row.genre as Genre,
    duration: formatShortDuration(row.duration_sec),
    durationSec: row.duration_sec ?? 0,
    poster: row.thumb,
    backdrop: row.thumb,
    year: new Date(row.created_at ?? Date.now()).getFullYear(),
    language: 'Tamil',
    synopsis: row.caption ?? '',
    synopsisTa: row.caption_ta ?? '',
    badge: 'REEL',
    videoUrl: row.video_url || undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Everything a viewer can find, newest first within each kind.
 *
 * Published only — a draft must not be reachable through search any more than
 * through the feed. Throws rather than falling back, so a failure surfaces as
 * "couldn't search" instead of silently searching invented content.
 */
export async function fetchSearchIndex(): Promise<Documentary[]> {
  const client = db();

  const [docs, reels] = await Promise.all([
    client.from('documentaries').select('*')
      .eq('status', 'Published').order('created_at', { ascending: false }),
    client.from('feed_reels').select('*')
      .eq('status', 'Published').order('created_at', { ascending: false }),
  ]);

  if (docs.error) throw new Error(`Could not search documentaries: ${docs.error.message}`);
  if (reels.error) throw new Error(`Could not search feed content: ${reels.error.message}`);

  return [
    ...(docs.data ?? []).map(rowToDocumentary),
    ...(reels.data ?? []).map(reelToDocumentary),
  ];
}

/**
 * Trending terms from the `trending_searches` table — the same source the
 * Flutter app already reads. Returns [] rather than throwing: suggestions are
 * supplementary, and losing them should not take the search box down with them.
 */
export async function fetchTrendingSearches(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('trending_searches').select('term').order('sort_order');
  if (error) {
    console.error('Could not load trending searches:', error.message);
    return [];
  }
  return (data ?? []).map((r) => String(r.term));
}
