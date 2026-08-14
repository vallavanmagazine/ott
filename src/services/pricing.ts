/**
 * Pricing + wallet-bonus logic (Section B4). Reads pricing_rates and
 * inspire_packages (public read); computes daily rates and top-up bonuses.
 */
import { supabase } from '@/lib/supabase';

export interface PricingRate { coverage: string; districtsCount: number; dailyRateRupees: number; }
export interface InspirePackage { id: string; name: string; priceRupees: number; durationMin: number; freeCreditRupees: number; includesMagazine: boolean; description?: string; }

const FALLBACK_RATES: PricingRate[] = [
  { coverage: '1 District', districtsCount: 1, dailyRateRupees: 99 },
  { coverage: '5 Districts', districtsCount: 5, dailyRateRupees: 199 },
  { coverage: '15 Districts', districtsCount: 15, dailyRateRupees: 399 },
  { coverage: 'All Tamil Nadu', districtsCount: 36, dailyRateRupees: 799 },
];

export async function fetchPricingRates(): Promise<PricingRate[]> {
  if (!supabase) return FALLBACK_RATES;
  try {
    const { data } = await supabase.from('pricing_rates').select('*').eq('is_active', true).order('districts_count');
    if (!data || data.length === 0) return FALLBACK_RATES;
    return data.map((r: any) => ({ coverage: r.coverage, districtsCount: r.districts_count, dailyRateRupees: Math.round(r.daily_rate_paise / 100) }));
  } catch { return FALLBACK_RATES; }
}

export async function fetchInspirePackages(): Promise<InspirePackage[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('inspire_packages').select('*').eq('is_active', true).order('price_paise');
    return (data ?? []).map((r: any) => ({
      id: r.id, name: r.name, priceRupees: Math.round(r.price_paise / 100), durationMin: r.video_duration_min,
      freeCreditRupees: Math.round((r.free_wallet_credit_paise ?? 0) / 100), includesMagazine: r.includes_magazine === true, description: r.description,
    }));
  } catch { return []; }
}

/** Daily rate (₹) for a district count — snaps up to the nearest tier. */
export function dailyRateForDistricts(count: number, rates: PricingRate[] = FALLBACK_RATES): number {
  const sorted = [...rates].sort((a, b) => a.districtsCount - b.districtsCount);
  for (const r of sorted) if (count <= r.districtsCount) return r.dailyRateRupees;
  return sorted[sorted.length - 1]?.dailyRateRupees ?? 799;
}

/** Top-up bonus % per the Section B4 tiers. */
export function walletBonusRupees(amountRupees: number): number {
  if (amountRupees >= 25000) return Math.round(amountRupees * 0.30);
  if (amountRupees >= 10000) return Math.round(amountRupees * 0.20);
  if (amountRupees >= 5000) return Math.round(amountRupees * 0.10);
  return 0;
}

export const MIN_TOPUP_RUPEES = 999;
export const TOPUP_PRESETS = [999, 2999, 4999, 9999];
