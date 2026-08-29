/**
 * Feed service — returns FeedReel[] shaped exactly as mockData.ts
 */
import { supabase } from '@/lib/supabase';
import { formatShortDuration, formatDate } from '@/lib/transforms';
import {
  feedReels as mockFeedReels,
  type FeedReel,
} from '@/data/mockData';

function rowToFeedReel(row: any): FeedReel {
  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title,
    titleTa: row.title_ta,
    caption: row.caption,
    captionTa: row.caption_ta,
    creator: row.creator,
    creatorHandle: row.creator_handle,
    contentType: row.content_type,
    genre: row.genre,
    duration: formatShortDuration(row.duration_sec),
    durationSec: row.duration_sec,
    thumb: row.thumb,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    views: row.views,
    status: row.status,
    uploaded: formatDate(row.created_at),
    stripAdHost: row.strip_ad_host,
    bannerAfter: row.banner_after,
    // attached_campaign is a UUID FK; mock shape expects the campaign NAME.
    attachedCampaign: row.campaign?.name || undefined,
    order: row.sort_order,
    videoUrl: row.video_url || undefined,
  };
}

export async function fetchFeedReels(): Promise<FeedReel[]> {
  if (!supabase) return mockFeedReels;

  const { data, error } = await supabase
    .from('feed_reels')
    .select('*, campaign:campaigns(name)')
    .order('created_at', { ascending: false }); // FIX 3: latest first

  if (error || !data) {
    console.warn('fetchFeedReels fallback to mock:', error?.message);
    return mockFeedReels;
  }

  return data.map(rowToFeedReel);
}

/**
 * Admin view of the feed. Same shape as the viewer's FeedReel plus the raw
 * campaign FK (the viewer shape only carries the campaign NAME, which is not
 * enough to prefill an edit form) and the source video URL.
 * Ordered by sort_order — that is the order viewers scroll through.
 */
export type AdminFeedReel = FeedReel & { attachedCampaignId: string | null };

export async function fetchAdminFeedReels(): Promise<AdminFeedReel[]> {
  if (!supabase) {
    return mockFeedReels.map((r) => ({ ...r, attachedCampaignId: null }));
  }

  const { data, error } = await supabase
    .from('feed_reels')
    .select('*, campaign:campaigns(name)')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.warn('fetchAdminFeedReels fallback to mock:', error?.message);
    return mockFeedReels.map((r) => ({ ...r, attachedCampaignId: null }));
  }

  return data.map((row: any) => ({
    ...rowToFeedReel(row),
    attachedCampaignId: row.attached_campaign ?? null,
  }));
}
