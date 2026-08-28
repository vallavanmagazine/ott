/**
 * Admin CRUD for the rate card: display-ad district tiers (`pricing_rates`)
 * and the Inspire production packages (`inspire_packages`).
 *
 * The viewer/sponsor-facing reads live in services/pricing.ts and stay
 * read-only; this module is the write side plus the admin list view (which
 * includes inactive tiers that the public read filters out).
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

function client() {
  if (!supabase) throw new Error('Supabase is not configured (.env missing).');
  return supabase;
}

export interface AdminPricingRate {
  id: string;
  coverage: string;
  districtsCount: number;
  dailyRateRupees: number;
  isActive: boolean;
}

export async function fetchAdminPricingRates(): Promise<AdminPricingRate[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('pricing_rates').select('*').order('districts_count');
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    id: r.id,
    coverage: r.coverage,
    districtsCount: r.districts_count,
    dailyRateRupees: Math.round(Number(r.daily_rate_paise || 0) / 100),
    isActive: r.is_active !== false,
  }));
}

export async function createPricingRate(input: { coverage: string; districtsCount: number; dailyRateRupees: number }) {
  const { error } = await client().from('pricing_rates').insert({
    coverage: input.coverage,
    districts_count: input.districtsCount,
    daily_rate_paise: Math.round(input.dailyRateRupees * 100),
    is_active: true,
  });
  if (error) throw error;
  await logAudit(`Added rate tier "${input.coverage}" at ₹${input.dailyRateRupees}/day`);
}

export async function updatePricingRate(id: string, input: Partial<{ coverage: string; districtsCount: number; dailyRateRupees: number; isActive: boolean }>) {
  const row: Record<string, unknown> = {};
  if (input.coverage !== undefined) row.coverage = input.coverage;
  if (input.districtsCount !== undefined) row.districts_count = input.districtsCount;
  if (input.dailyRateRupees !== undefined) row.daily_rate_paise = Math.round(input.dailyRateRupees * 100);
  if (input.isActive !== undefined) row.is_active = input.isActive;
  const { error } = await client().from('pricing_rates').update(row).eq('id', id);
  if (error) throw error;
  await logAudit(`Updated rate tier ${input.coverage ?? id}`);
}

export async function deletePricingRate(id: string, coverage?: string) {
  const { error } = await client().from('pricing_rates').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted rate tier "${coverage ?? id}"`);
}

export interface AdminInspirePackage {
  id: string;
  name: string;
  priceRupees: number;
  productionCostRupees: number;
  videoDurationMin: number;
  freeCreditRupees: number;
  includesMagazine: boolean;
  description: string;
  isActive: boolean;
}

export async function fetchAdminInspirePackages(): Promise<AdminInspirePackage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('inspire_packages').select('*').order('price_paise');
  if (error || !data) return [];
  return (data as any[]).map((p) => ({
    id: p.id,
    name: p.name,
    priceRupees: Math.round(Number(p.price_paise || 0) / 100),
    productionCostRupees: Math.round(Number(p.production_cost_paise || 0) / 100),
    videoDurationMin: p.video_duration_min ?? 0,
    freeCreditRupees: Math.round(Number(p.free_wallet_credit_paise || 0) / 100),
    includesMagazine: p.includes_magazine === true,
    description: p.description ?? '',
    isActive: p.is_active !== false,
  }));
}

export type InspirePackageInput = Omit<AdminInspirePackage, 'id'>;

function packageToRow(input: Partial<InspirePackageInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.priceRupees !== undefined) row.price_paise = Math.round(input.priceRupees * 100);
  if (input.productionCostRupees !== undefined) row.production_cost_paise = Math.round(input.productionCostRupees * 100);
  if (input.videoDurationMin !== undefined) row.video_duration_min = input.videoDurationMin;
  if (input.freeCreditRupees !== undefined) row.free_wallet_credit_paise = Math.round(input.freeCreditRupees * 100);
  if (input.includesMagazine !== undefined) row.includes_magazine = input.includesMagazine;
  if (input.description !== undefined) row.description = input.description;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}

export async function createInspirePackage(input: InspirePackageInput) {
  const { error } = await client().from('inspire_packages').insert(packageToRow(input));
  if (error) throw error;
  await logAudit(`Added Inspire package "${input.name}"`);
}

export async function updateInspirePackage(id: string, input: Partial<InspirePackageInput>) {
  const { error } = await client().from('inspire_packages').update(packageToRow(input)).eq('id', id);
  if (error) throw error;
  await logAudit(`Updated Inspire package "${input.name ?? id}"`);
}

export async function deleteInspirePackage(id: string, name?: string) {
  const { error } = await client().from('inspire_packages').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted Inspire package "${name ?? id}"`);
}
