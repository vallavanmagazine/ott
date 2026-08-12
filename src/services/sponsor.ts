/**
 * Sponsor-facing operations (Phase 3). Resolves the logged-in sponsor org,
 * campaign create/submit/pause/resume, ad creatives, and wallet reads.
 * Writes are gated by sponsor-ownership RLS (see supabase/rls_and_tables.sql).
 */
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';
import { logAudit } from '@/services/admin-writes';

function client() {
  if (!supabase) throw new Error('Supabase is not configured (.env missing).');
  return supabase;
}

/** Resolve the sponsors.id for the current auth user (owner_id first, then email). */
export async function getCurrentSponsorId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return null;

  // Prefer owner_id link
  const byOwner = await supabase.from('sponsors').select('id').eq('owner_id', user.id).maybeSingle();
  if (byOwner.data?.id) return byOwner.data.id;

  // Fall back to email match
  if (user.email) {
    const byEmail = await supabase.from('sponsors').select('id').ilike('email', user.email).maybeSingle();
    if (byEmail.data?.id) return byEmail.data.id;
  }
  return null;
}

export interface SponsorCampaign {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;        // rupees
  startDate: string;
  targetDistricts: string[];
}

function rowToSponsorCampaign(row: any): SponsorCampaign {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
    spend: Number(row.spend_paise ?? 0) / 100,
    startDate: row.start_date ? formatDate(row.start_date) : '—',
    targetDistricts: row.target_districts ?? [],
  };
}

/** All campaigns owned by the current sponsor. Empty array if none / not a sponsor. */
export async function fetchMyCampaigns(): Promise<SponsorCampaign[]> {
  const sponsorId = await getCurrentSponsorId();
  if (!supabase || !sponsorId) return [];
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, status, impressions, clicks, spend_paise, start_date, target_districts')
    .eq('sponsor_id', sponsorId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToSponsorCampaign);
}

export interface CreateCampaignInput {
  name: string;
  budgetRupees: number;
  targetDistricts: string[];
  submit?: boolean; // true → 'Pending Approval', else 'Draft'
}

export async function createCampaign(input: CreateCampaignInput) {
  const sponsorId = await getCurrentSponsorId();
  if (!sponsorId) throw new Error('No sponsor profile linked to this account.');
  const status = input.submit ? 'Pending Approval' : 'Draft';
  const { data, error } = await client()
    .from('campaigns')
    .insert({
      sponsor_id: sponsorId,
      name: input.name,
      status,
      budget_paise: Math.round(input.budgetRupees * 100),
      target_districts: input.targetDistricts,
      start_date: new Date().toISOString().slice(0, 10),
      submitted_at: input.submit ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  await logAudit(`Sponsor created campaign "${input.name}" (${status})`);
  return data;
}

export async function submitCampaign(id: string, name?: string) {
  const { error } = await client()
    .from('campaigns')
    .update({ status: 'Pending Approval', submitted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  await logAudit(`Submitted campaign "${name ?? id}" for approval`);
}

export async function pauseCampaign(id: string, name?: string) {
  const { error } = await client().from('campaigns').update({ status: 'Paused' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Paused campaign "${name ?? id}"`);
}

export async function resumeCampaign(id: string, name?: string) {
  const { error } = await client().from('campaigns').update({ status: 'Active' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Resumed campaign "${name ?? id}"`);
}

// ---------------------------------------------------------------------------
// Ad creatives
// ---------------------------------------------------------------------------
export interface CreateAdInput {
  headline: string;
  body: string;
  cta: string;
  bgImage: string;
  accent: string;
  sponsorName: string;
}

export async function createAd(input: CreateAdInput) {
  const sponsorId = await getCurrentSponsorId();
  const { data, error } = await client()
    .from('ads')
    .insert({
      sponsor: input.sponsorName,
      sponsor_id: sponsorId,
      sponsor_logo: '',
      headline: input.headline,
      body: input.body,
      cta: input.cta,
      bg_image: input.bgImage,
      accent: input.accent,
    })
    .select()
    .single();
  if (error) throw error;
  await logAudit(`Sponsor created ad creative "${input.headline}"`);
  return data;
}

// ---------------------------------------------------------------------------
// Wallet (read-only here; top-up/deduction handled by NestJS in Phase 5)
// ---------------------------------------------------------------------------
export interface WalletView {
  balanceRupees: number;
  transactions: { id: string; amountRupees: number; kind: string; date: string }[];
}

export async function fetchWallet(): Promise<WalletView> {
  const empty: WalletView = { balanceRupees: 0, transactions: [] };
  const sponsorId = await getCurrentSponsorId();
  if (!supabase || !sponsorId) return empty;

  const [{ data: wallet }, { data: txns }] = await Promise.all([
    supabase.from('wallets').select('balance_paise').eq('sponsor_id', sponsorId).maybeSingle(),
    supabase.from('wallet_transactions').select('id, amount_paise, kind, created_at')
      .eq('sponsor_id', sponsorId).order('created_at', { ascending: false }).limit(50),
  ]);

  return {
    balanceRupees: Number(wallet?.balance_paise ?? 0) / 100,
    transactions: (txns ?? []).map((t: any) => ({
      id: t.id,
      amountRupees: Number(t.amount_paise) / 100,
      kind: t.kind,
      date: t.created_at ? formatDate(t.created_at) : '—',
    })),
  };
}

/**
 * Credit the sponsor wallet after a successful Razorpay (test) payment.
 * Idempotent by payment reference. Requires the sponsor wallet RLS in
 * supabase/wallet_client_rls.sql. For production, prefer the NestJS /wallet/verify
 * path (server-verified signature). Test-mode client credit is fine for now.
 */
export async function topUpWallet(amountRupees: number, reference: string): Promise<WalletView> {
  const sponsorId = await getCurrentSponsorId();
  if (!supabase || !sponsorId) throw new Error('No sponsor profile linked to this account.');
  const sb = supabase;
  const paise = Math.round(amountRupees * 100);

  const { data: existing } = await sb
    .from('wallet_transactions').select('id').eq('kind', 'topup').eq('reference', reference).maybeSingle();

  if (!existing) {
    await sb.from('wallet_transactions').insert({ sponsor_id: sponsorId, amount_paise: paise, kind: 'topup', reference });
    const { data: w } = await sb.from('wallets').select('balance_paise').eq('sponsor_id', sponsorId).maybeSingle();
    const current = Number(w?.balance_paise ?? 0);
    await sb.from('wallets').upsert(
      { sponsor_id: sponsorId, balance_paise: current + paise, updated_at: new Date().toISOString() },
      { onConflict: 'sponsor_id' },
    );
    await logAudit(`Wallet topped up ₹${amountRupees.toLocaleString('en-IN')} (test)`);
  }
  return fetchWallet();
}
