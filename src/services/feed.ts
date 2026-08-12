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
  };
}

export async function fetchFeedReels(): Promise<FeedReel[]> {
  if (!supabase) return mockFeedReels;

  const { data, error } = await supabase
    .from('feed_reels')
    .select('*, campaign:campaigns(name)')
    .order('sort_order', { ascending: true });

  if (error || !data) {
    console.warn('fetchFeedReels fallback to mock:', error?.message);
    return mockFeedReels;
  }

  return data.map(rowToFeedReel);
}
