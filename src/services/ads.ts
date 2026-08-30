/**
 * Ads service — returns AdContent[] shaped exactly as mockData.ts
 *
 * No mock fallback: mockData's ads carry invented sponsor names, and showing a
 * viewer a fabricated sponsor under an "Ad" badge is worse than showing none.
 * Unlike the feed this returns [] rather than throwing — an ad outage should
 * leave the content it decorates intact, not blank the screen it sits on.
 */
import { supabase } from '@/lib/supabase';
import { type AdContent } from '@/data/mockData';

function rowToAdContent(row: any): AdContent {
  return {
    id: row.id,
    sponsor: row.sponsor,
    sponsorLogo: row.sponsor_logo,
    headline: row.headline,
    body: row.body,
    cta: row.cta,
    bgImage: row.bg_image,
    accent: row.accent,
  };
}

export async function fetchAds(): Promise<AdContent[]> {
  if (!supabase) {
    console.error('fetchAds: Supabase is not configured in this build — no ads will be shown.');
    return [];
  }

  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAds failed — no ads will be shown:', error.message);
    return [];
  }

  return (data ?? []).map(rowToAdContent);
}
