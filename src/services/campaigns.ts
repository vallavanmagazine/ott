/**
 * Campaigns service — returns data shaped as campaigns array in mockData.ts
 */
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';
import { campaigns as mockCampaigns } from '@/data/mockData';

export async function fetchCampaigns() {
  if (!supabase) return mockCampaigns;

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, status, impressions, clicks, spend_paise, start_date')
    .order('created_at', { ascending: false });

  if (error || !data) return mockCampaigns;

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    impressions: row.impressions,
    clicks: row.clicks,
    spend: Number(row.spend_paise) / 100, // paise → rupees (mock spend is rupee integer)
    startDate: row.start_date ? formatDate(row.start_date) : '—',
  }));
}

export async function fetchCampaignsBySponsors(sponsorId: string) {
  if (!supabase) return mockCampaigns;

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, status, impressions, clicks, spend_paise, start_date')
    .eq('sponsor_id', sponsorId)
    .order('created_at', { ascending: false });

  if (error || !data) return mockCampaigns;

  return data.map((row: any) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    impressions: row.impressions,
    clicks: row.clicks,
    spend: row.spend_paise,
    startDate: row.start_date ? formatDate(row.start_date) : '—',
  }));
}
