/**
 * Ad serving engine. Selection order for every slot:
 *   1) Active campaigns whose target_districts include the viewer's district
 *   2) else statewide campaigns (empty target_districts)
 *   3) else any ad creative
 *   4) else the Vallavan house ad (self-promo)
 * Rotation: least-impressions-served first (from ad_events). Events go to
 * `ad_events` (public insert) with kind=impression|click + placement=slot type.
 */
import { supabase } from '@/lib/supabase';
import { ads as mockAds, type AdContent } from '@/data/mockData';

export type AdSlot = 'preroll' | 'midroll' | 'postroll' | 'strip' | 'banner';

/** Ad creative + the campaign it belongs to (for tracking). */
export interface ServedAd {
  ad: AdContent;
  campaignId: string | null;
}

export const HOUSE_AD: AdContent = {
  id: 'house-vallavan',
  sponsor: 'Vallavan',
  sponsorLogo: '',
  headline: 'Documentaries That Matter — Free, for Everyone',
  body: 'Tamil-first stories. Supported by sponsors like you.',
  cta: 'Explore',
  bgImage: '30004134',
  accent: '#D32F2F',
};

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

/** Candidate ads (with campaign id) for a district, applying the geo cascade. */
async function candidatesForDistrict(district: string): Promise<{ ad: AdContent; campaignId: string | null }[]> {
  if (!supabase) return mockAds.map((ad) => ({ ad, campaignId: null }));
  try {
    // 1) district-targeted active campaigns
    const geo = await supabase.from('campaigns').select('id').eq('status', 'Active').contains('target_districts', [district]);
    let campaignIds = (geo.data ?? []).map((c: any) => c.id);

    // 2) statewide (empty target_districts) active campaigns
    if (campaignIds.length === 0) {
      const state = await supabase.from('campaigns').select('id, target_districts').eq('status', 'Active');
      campaignIds = (state.data ?? []).filter((c: any) => !c.target_districts || c.target_districts.length === 0).map((c: any) => c.id);
    }

    if (campaignIds.length > 0) {
      const { data } = await supabase.from('ads').select('*').in('campaign_id', campaignIds);
      if (data && data.length) return data.map((r: any) => ({ ad: rowToAd(r), campaignId: r.campaign_id ?? null }));
    }

    // 3) any ad
    const anyAds = await supabase.from('ads').select('*').limit(20);
    if (anyAds.data && anyAds.data.length) return anyAds.data.map((r: any) => ({ ad: rowToAd(r), campaignId: r.campaign_id ?? null }));
  } catch { /* fall through */ }
  return mockAds.map((ad) => ({ ad, campaignId: null }));
}

/** Sort candidate ad ids by fewest impressions served (fair rotation). */
async function orderByFewestImpressions<T extends { ad: AdContent }>(cands: T[]): Promise<T[]> {
  if (!supabase || cands.length <= 1) return cands;
  try {
    const ids = cands.map((c) => c.ad.id).filter((id) => id && id !== HOUSE_AD.id);
    if (!ids.length) return cands;
    const { data } = await supabase.from('ad_events').select('ad_id').eq('kind', 'impression').in('ad_id', ids);
    const counts = new Map<string, number>();
    for (const e of data ?? []) counts.set((e as any).ad_id, (counts.get((e as any).ad_id) ?? 0) + 1);
    return [...cands].sort((a, b) => (counts.get(a.ad.id) ?? 0) - (counts.get(b.ad.id) ?? 0));
  } catch {
    return cands;
  }
}

/** Video ad (image creative) for pre/mid-roll. Excludes already-shown ads. */
export async function getVideoAd(district: string, excludeAdIds: string[] = []): Promise<ServedAd> {
  const cands = (await candidatesForDistrict(district)).filter((c) => !excludeAdIds.includes(c.ad.id));
  if (cands.length === 0) return { ad: HOUSE_AD, campaignId: null };
  const ordered = await orderByFewestImpressions(cands);
  return { ad: ordered[0].ad, campaignId: ordered[0].campaignId };
}

/** Banner/strip creative for the timer-based overlay during playback. */
export async function getOverlayAd(district: string, excludeAdIds: string[] = []): Promise<ServedAd> {
  const cands = (await candidatesForDistrict(district)).filter((c) => !excludeAdIds.includes(c.ad.id));
  if (cands.length === 0) return { ad: HOUSE_AD, campaignId: null };
  const ordered = await orderByFewestImpressions(cands);
  // Prefer a different creative than pre-roll where possible.
  return { ad: ordered[ordered.length > 1 ? 1 : 0].ad, campaignId: ordered[ordered.length > 1 ? 1 : 0].campaignId };
}

/** Vallavan house ad — used when no sponsor ads are available. */
export function getHouseAd(): ServedAd {
  return { ad: HOUSE_AD, campaignId: null };
}

async function track(kind: 'impression' | 'click', adId?: string, campaignId?: string | null, district?: string, placement?: AdSlot) {
  if (!supabase) return;
  if (!adId || adId === HOUSE_AD.id) return; // don't record house-ad UUIDs (not in DB)
  try {
    await supabase.from('ad_events').insert({ ad_id: adId, campaign_id: campaignId ?? null, district: district ?? null, kind, placement: placement ?? null });
  } catch { /* best-effort */ }
}

export const trackAdImpression = (adId?: string, campaignId?: string | null, district?: string, slot?: AdSlot) =>
  track('impression', adId, campaignId, district, slot);

export const trackAdClick = (adId?: string, campaignId?: string | null, district?: string, slot?: AdSlot) =>
  track('click', adId, campaignId, district, slot);

// --- Back-compat shims (existing callers) ---
export const trackImpression = (adId?: string, campaignId?: string, district?: string) => track('impression', adId, campaignId ?? null, district, 'preroll');
export const trackClick = (adId?: string, campaignId?: string, district?: string) => track('click', adId, campaignId ?? null, district, 'banner');
export async function getVideoAdForViewer(district: string): Promise<AdContent | null> { return (await getVideoAd(district)).ad; }
export async function getOverlayAdForViewer(district: string): Promise<AdContent | null> { return (await getOverlayAd(district)).ad; }
