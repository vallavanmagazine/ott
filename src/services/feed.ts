/**
 * Feed service — returns FeedReel[] shaped exactly as mockData.ts
 *
 * Deliberately has NO mock fallback. It used to answer every failure — Supabase
 * unconfigured, RLS refusal, network error — by returning mockData's feedReels.
 * Those ten entries are the same ten rows the seed created, so a build that
 * could not reach the database rendered a feed indistinguishable from the real
 * one, and nothing said so: the `!supabase` branch did not even warn. Failures
 * now propagate and the screen reports them.
 */
import { supabase } from '@/lib/supabase';
import { formatShortDuration, formatDate } from '@/lib/transforms';
import { type FeedReel } from '@/data/mockData';
import { displayViews } from '@/lib/view-ramp';

/**
 * The client, or a diagnosis. A null `supabase` means the VITE_SUPABASE_* vars
 * were absent *at build time* — Vite inlines them, so this is a property of the
 * bundle, not of the machine serving it. Naming that is the whole point: it is
 * the failure most likely to be mistaken for "the data is wrong".
 */
function db() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured in this build — VITE_SUPABASE_URL and '
      + 'VITE_SUPABASE_ANON_KEY were missing when it was compiled. Rebuild with a .env present.',
    );
  }
  return supabase;
}

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

/**
 * The viewer feed. Published only — the CMS Draft/Published toggle was
 * previously decorative here, since this query returned every row regardless.
 *
 * `views` is overlaid with the synthetic floor from lib/view-ramp.ts. That
 * happens HERE and not in rowToFeedReel() on purpose: the admin path below, and
 * the dashboards in admin-stats/admin-analytics that read feed_reels.views
 * directly, must keep seeing the true stored number. Nothing is written back.
 */
export async function fetchFeedReels(): Promise<FeedReel[]> {
  const { data, error } = await db()
    .from('feed_reels')
    .select('*, campaign:campaigns(name)')
    .eq('status', 'Published')
    .order('created_at', { ascending: false }); // FIX 3: latest first

  if (error) throw new Error(`Could not load the feed: ${error.message}`);

  return (data ?? []).map((row) => ({
    ...rowToFeedReel(row),
    views: displayViews({
      id: row.id,
      // published_at is what the ramp should measure from; created_at is the
      // fallback until supabase/feed_view_ramp.sql adds the column, and is the
      // same value for anything published straight away.
      publishedAt: row.published_at ?? row.created_at,
      initialSeedViews: row.initial_seed_views ?? null,
      realViews: row.views,
    }),
  }));
}

/**
 * Admin view of the feed. Same shape as the viewer's FeedReel plus the raw
 * campaign FK (the viewer shape only carries the campaign NAME, which is not
 * enough to prefill an edit form) and the source video URL.
 * Ordered by sort_order — that is the order viewers scroll through.
 */
export type AdminFeedReel = FeedReel & { attachedCampaignId: string | null };

/** Every row, drafts included — the CMS is the one place that must see them. */
export async function fetchAdminFeedReels(): Promise<AdminFeedReel[]> {
  const { data, error } = await db()
    .from('feed_reels')
    .select('*, campaign:campaigns(name)')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Could not load feed content: ${error.message}`);

  return (data ?? []).map((row) => ({
    ...rowToFeedReel(row),
    attachedCampaignId: row.attached_campaign ?? null,
  }));
}
