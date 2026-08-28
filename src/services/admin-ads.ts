/**
 * Admin ad management. Two related things live here:
 *   - ad CREATIVES (`ads`) — the headline/body/CTA/image a viewer sees
 *   - ad PLACEMENTS (`ad_placements`) — where a creative runs, and its status
 *
 * Impressions in `ad_placements.impressions` are the running counter; the
 * per-district split comes from `ad_events`, which the ad engine writes with
 * the viewer's detected district.
 */
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';
import type { DistrictStat } from '@/services/admin-campaigns';

export interface AdCreativeRow {
  id: string;
  sponsor: string;
  sponsorId: string | null;
  sponsorLogo: string;
  headline: string;
  body: string;
  cta: string;
  bgImage: string;
  accent: string;
  campaignId: string | null;
  campaignName: string;
  campaignStatus: string;
  /** Districts the parent campaign targets; empty means all Tamil Nadu. */
  targetDistricts: string[];
  created: string;
}

function rowToCreative(r: any): AdCreativeRow {
  return {
    id: r.id,
    sponsor: r.sponsor,
    sponsorId: r.sponsor_id ?? null,
    sponsorLogo: r.sponsor_logo ?? '',
    headline: r.headline,
    body: r.body,
    cta: r.cta,
    bgImage: r.bg_image,
    accent: r.accent,
    campaignId: r.campaign_id ?? null,
    campaignName: r.campaign?.name ?? '—',
    campaignStatus: r.campaign?.status ?? '—',
    targetDistricts: r.campaign?.target_districts ?? [],
    created: r.created_at ? formatDate(r.created_at) : '—',
  };
}

export async function fetchAdCreatives(): Promise<AdCreativeRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ads')
    .select('*, campaign:campaigns(name, status, target_districts)')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToCreative);
}

export interface AdPlacementRow {
  id: string;
  sponsor: string;
  placement: string;
  impressions: number;
  status: string;
  adId: string | null;
  headline: string;
  bgImage: string;
  accent: string;
  campaignName: string;
  targetDistricts: string[];
}

export async function fetchAdPlacements(): Promise<AdPlacementRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ad_placements')
    .select('*, ad:ads(headline, bg_image, accent, campaign:campaigns(name, target_districts))')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id,
    sponsor: r.sponsor,
    placement: r.placement,
    impressions: r.impressions ?? 0,
    status: r.status ?? 'Live',
    adId: r.ad_id ?? null,
    headline: r.ad?.headline ?? '—',
    bgImage: r.ad?.bg_image ?? '',
    accent: r.ad?.accent ?? '#D32F2F',
    campaignName: r.ad?.campaign?.name ?? '—',
    targetDistricts: r.ad?.campaign?.target_districts ?? [],
  }));
}

/** Per-district impression/click split for a single creative. */
export async function fetchAdDistrictStats(adId: string): Promise<DistrictStat[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('ad_events')
    .select('district, kind')
    .eq('ad_id', adId)
    .limit(5000);
  if (error || !data) return [];

  const map = new Map<string, DistrictStat>();
  for (const e of data as any[]) {
    const key = e.district || 'Unknown';
    const stat = map.get(key) ?? { district: key, impressions: 0, clicks: 0 };
    if (e.kind === 'click') stat.clicks++; else stat.impressions++;
    map.set(key, stat);
  }
  return [...map.values()].sort((a, b) => b.impressions - a.impressions);
}
