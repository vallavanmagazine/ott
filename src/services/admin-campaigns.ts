/**
 * Admin campaign management — the full campaign list (all statuses) plus
 * per-campaign analytics: geo breakdown and a daily impression timeline, both
 * derived from `ad_events` rows written by the ad engine.
 */
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';

export interface AdminCampaignRow {
  id: string;
  name: string;
  sponsorId: string;
  sponsorName: string;
  status: string;
  impressions: number;
  clicks: number;
  /** rupees */
  spend: number;
  /** rupees */
  budget: number;
  districts: string[];
  startDate: string;
  submitted: string;
  dailyRateRupees: number;
}

export function ctr(row: { impressions: number; clicks: number }): number {
  return row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
}

function rowToCampaign(r: any): AdminCampaignRow {
  return {
    id: r.id,
    name: r.name,
    sponsorId: r.sponsor_id,
    sponsorName: r.sponsor?.name ?? 'Unknown',
    status: r.status,
    impressions: r.impressions ?? 0,
    clicks: r.clicks ?? 0,
    spend: Number(r.spend_paise || 0) / 100,
    budget: Number(r.budget_paise || 0) / 100,
    districts: r.target_districts ?? [],
    startDate: r.start_date ? formatDate(r.start_date) : '—',
    submitted: r.submitted_at ? formatDate(r.submitted_at) : '—',
    dailyRateRupees: Number(r.daily_rate_paise || 0) / 100,
  };
}

export async function fetchAllCampaigns(): Promise<AdminCampaignRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('campaigns')
    .select('*, sponsor:sponsors(name)')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToCampaign);
}

export interface DistrictStat {
  district: string;
  impressions: number;
  clicks: number;
}

export interface DayStat {
  day: string;
  impressions: number;
}

export interface CampaignAnalytics {
  byDistrict: DistrictStat[];
  byDay: DayStat[];
  impressions: number;
  clicks: number;
}

/**
 * Aggregates ad_events for one campaign. Grouping happens client-side: the
 * event volume per campaign is small (thousands), and PostgREST has no
 * GROUP BY, so a server-side rollup would need an RPC we do not have yet.
 */
export async function fetchCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
  const empty: CampaignAnalytics = { byDistrict: [], byDay: [], impressions: 0, clicks: 0 };
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from('ad_events')
    .select('district, kind, created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
    .limit(5000);
  if (error || !data) return empty;

  const districts = new Map<string, DistrictStat>();
  const days = new Map<string, number>();
  let impressions = 0;
  let clicks = 0;

  for (const e of data as any[]) {
    const isClick = e.kind === 'click';
    if (isClick) clicks++; else impressions++;

    const key = e.district || 'Unknown';
    const stat = districts.get(key) ?? { district: key, impressions: 0, clicks: 0 };
    if (isClick) stat.clicks++; else stat.impressions++;
    districts.set(key, stat);

    if (!isClick && e.created_at) {
      const day = String(e.created_at).slice(0, 10);
      days.set(day, (days.get(day) ?? 0) + 1);
    }
  }

  return {
    byDistrict: [...districts.values()].sort((a, b) => b.impressions - a.impressions),
    byDay: [...days.entries()].map(([day, count]) => ({ day, impressions: count })),
    impressions,
    clicks,
  };
}

/** Impressions + clicks per district across every campaign (Ad Management). */
export async function fetchDistrictBreakdownByAd(): Promise<Record<string, DistrictStat[]>> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('ad_events')
    .select('ad_id, district, kind')
    .limit(5000);
  if (error || !data) return {};

  const byAd: Record<string, Map<string, DistrictStat>> = {};
  for (const e of data as any[]) {
    if (!e.ad_id) continue;
    const map = byAd[e.ad_id] ?? (byAd[e.ad_id] = new Map());
    const key = e.district || 'Unknown';
    const stat = map.get(key) ?? { district: key, impressions: 0, clicks: 0 };
    if (e.kind === 'click') stat.clicks++; else stat.impressions++;
    map.set(key, stat);
  }

  const out: Record<string, DistrictStat[]> = {};
  for (const [adId, map] of Object.entries(byAd)) {
    out[adId] = [...map.values()].sort((a, b) => b.impressions - a.impressions);
  }
  return out;
}

/** Sponsor picker options for forms that attach a campaign or ad to a sponsor. */
export async function fetchSponsorOptions(): Promise<{ id: string; name: string }[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('sponsors').select('id, name').order('name');
  return (data ?? []).map((s: any) => ({ id: s.id, name: s.name }));
}

/** Campaign picker options (id + label) for attaching ads/reels to a campaign. */
export async function fetchCampaignOptions(): Promise<{ id: string; name: string }[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('campaigns').select('id, name').order('created_at', { ascending: false });
  return (data ?? []).map((c: any) => ({ id: c.id, name: c.name }));
}
