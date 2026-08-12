/**
 * Ads service — returns AdContent[] shaped exactly as mockData.ts
 */
import { supabase } from '@/lib/supabase';
import {
  ads as mockAds,
  type AdContent,
} from '@/data/mockData';

function rowToAdContent(row: any): AdContent {
  return {
    id: row.id,
    sponsor: row.sponsor_name,
    sponsorLogo: row.sponsor_logo,
    headline: row.headline,
    body: row.body,
    cta: row.cta,
    bgImage: row.bg_image,
    accent: row.accent,
  };
}

export async function fetchAds(): Promise<AdContent[]> {
  if (!supabase) return mockAds;

  const { data, error } = await supabase
    .from('ad_contents')
    .select('*')
    .eq('status', 'Live')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.warn('fetchAds fallback to mock:', error?.message);
    return mockAds;
  }

  return data.map(rowToAdContent);
}
