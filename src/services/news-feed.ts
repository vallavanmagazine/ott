/**
 * Quick News Post (Phase 7): one admin action populates BOTH the Feed screen
 * (feed_reels, content_type='News', 60-char title on the card) AND the Live TV
 * ticker (ticker_items, full 200-char text).
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export interface NewsItemInput {
  title60: string;    // shown on the reel card
  fullText200: string; // shown in ticker + read-more
  titleTa?: string;
  thumb?: string;
  genre?: string;
}

export async function createNewsItem(input: NewsItemInput): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const title = input.title60.slice(0, 60);
  const caption = input.fullText200.slice(0, 200);

  // 1) Feed reel
  const { error: reelErr } = await supabase.from('feed_reels').insert({
    title,
    title_ta: input.titleTa ?? title,
    caption,
    caption_ta: '',
    creator: 'Vallavan News',
    creator_handle: '@vallavannews',
    content_type: 'News',
    genre: input.genre ?? 'Society',
    duration_sec: 30,
    thumb: input.thumb || '20212135',
    status: 'Published',
    sort_order: 0,
  });
  if (reelErr) throw reelErr;

  // 2) Ticker item (24h expiry for news)
  const { error: tickErr } = await supabase.from('ticker_items').insert({
    text: caption,
    text_ta: input.titleTa ?? null,
    source: 'manual',
    priority: 5,
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
  if (tickErr) throw tickErr;

  await logAudit(`Posted news: "${title}"`);
}
