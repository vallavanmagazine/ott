/**
 * Ad serving engine. For every slot:
 *   1) Eligible = creatives on Active campaigns that either target the viewer's
 *      district OR are statewide (empty target_districts).
 *   2) If none, unattached house inventory (ads with no campaign).
 *   3) If still none, the Vallavan house ad (self-promo).
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

/**
 * Candidate ads (with campaign id) eligible for one district.
 *
 * Eligibility is a UNION, not a fallback chain: a campaign targeting Chennai
 * and a statewide campaign are both eligible for a Chennai viewer. That is what
 * the two product rules require together —
 *   "select Chennai  → shows ONLY to Chennai viewers"  (district-scoped)
 *   "select All TN   → shows to everyone"              (always eligible)
 * A fallback chain would satisfy the first but break the second, because a
 * statewide campaign would go dark in every district that had a targeted
 * campaign running. House inventory is only reached when no campaign qualifies.
 */
async function candidatesForDistrict(district: string): Promise<{ ad: AdContent; campaignId: string | null }[]> {
  if (!supabase) return mockAds.map((ad) => ({ ad, campaignId: null }));
  try {
    // Every active campaign, then keep the ones this district qualifies for.
    const { data: active } = await supabase
      .from('campaigns')
      .select('id, target_districts')
      .eq('status', 'Active');

    const campaignIds = (active ?? [])
      .filter((c: any) => {
        const districts: string[] = c.target_districts ?? [];
        return districts.length === 0 || districts.includes(district);
      })
      .map((c: any) => c.id);

    if (campaignIds.length > 0) {
      const { data } = await supabase.from('ads').select('*').in('campaign_id', campaignIds);
      if (data && data.length) return data.map((r: any) => ({ ad: rowToAd(r), campaignId: r.campaign_id ?? null }));
    }

    // No campaign creative available — fall back to unattached house inventory.
    const anyAds = await supabase.from('ads').select('*').is('campaign_id', null).limit(20);
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
