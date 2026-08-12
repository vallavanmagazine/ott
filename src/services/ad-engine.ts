/**
 * Ad serving engine (Phase 4/3-lite). Chooses creatives for a viewer based on
 * active campaigns targeting their district, and records impression/click
 * events. Events go to `ad_events` (public INSERT policy) so anon viewers can
 * be counted; admins aggregate. Falls back to any ad, then mock, so the UI
 * always has a creative.
 */
import { supabase } from '@/lib/supabase';
import { ads as mockAds, type AdContent } from '@/data/mockData';

function rowToAd(row: any): AdContent {
  return {
    id: row.id,
    sponsor: row.sponsor,
    sponsorLogo: row.sponsor_logo ?? '',
    headline: row.headline,
    body: row.body,
    cta: row.cta,
    bgImage: row.bg_image,
    accent: row.accent,
  };
}

/** Ads tied to Active campaigns that target this district; else any ad; else mock. */
export async function getAdsForDistrict(district: string): Promise<AdContent[]> {
  if (!supabase) return mockAds;
  try {
    const { data: camps } = await supabase
      .from('campaigns')
      .select('id')
      .eq('status', 'Active')
      .contains('target_districts', [district]);

    const campaignIds = (camps ?? []).map((c: any) => c.id);
    if (campaignIds.length) {
      const { data: ads } = await supabase.from('ads').select('*').in('campaign_id', campaignIds);
      if (ads && ads.length) return ads.map(rowToAd);
    }

    // Fallback: any ad creative
    const { data: anyAds } = await supabase.from('ads').select('*').limit(10);
    if (anyAds && anyAds.length) return anyAds.map(rowToAd);
  } catch { /* fall through */ }
  return mockAds;
}

/** Pre-roll / mid-roll creative for the viewer's district. */
export async function getVideoAdForViewer(district: string): Promise<AdContent | null> {
  const ads = await getAdsForDistrict(district);
  return ads[0] ?? null;
}

/** Overlay banner creative for the viewer's district. */
export async function getOverlayAdForViewer(district: string): Promise<AdContent | null> {
  const ads = await getAdsForDistrict(district);
  return ads[ads.length > 1 ? 1 : 0] ?? null;
}

async function track(kind: 'impression' | 'click', adId?: string, campaignId?: string, district?: string) {
  if (!supabase) return;
  try {
    await supabase.from('ad_events').insert({
      ad_id: adId ?? null,
      campaign_id: campaignId ?? null,
      district: district ?? null,
      kind,
    });
  } catch { /* best-effort */ }
}

export const trackImpression = (adId?: string, campaignId?: string, district?: string) =>
  track('impression', adId, campaignId, district);

export const trackClick = (adId?: string, campaignId?: string, district?: string) =>
  track('click', adId, campaignId, district);
