/**
 * Admin sponsor management — the 360° view of one advertiser: profile, wallet
 * balance and transaction ledger, campaigns, invoices and payment links.
 *
 * The list query aggregates campaigns + wallet in one round-trip via nested
 * selects; the detail query fans out because those tables have no shared join.
 */
import { supabase } from '@/lib/supabase';
import { formatDate, formatMonthYear, formatDateShort } from '@/lib/transforms';

export interface AdminSponsorRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  ownerName: string;
  district: string;
  gstNumber: string;
  businessType: string;
  status: string;
  joined: string;
  campaignCount: number;
  activeCampaigns: number;
  /** rupees */
  spend: number;
  /** rupees */
  walletBalance: number;
}

function rowToSponsor(row: any, walletByS: Record<string, number>): AdminSponsorRow {
  const campaignRows: any[] = Array.isArray(row.campaigns) ? row.campaigns : [];
  const spendPaise = campaignRows.reduce((sum, c) => sum + Number(c.spend_paise || 0), 0);
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    ownerName: row.owner_name ?? '',
    district: row.district ?? '',
    gstNumber: row.gst_number ?? '',
    businessType: row.business_type ?? '',
    status: row.status,
    joined: formatMonthYear(row.created_at),
    campaignCount: campaignRows.length,
    activeCampaigns: campaignRows.filter((c) => c.status === 'Active').length,
    spend: spendPaise / 100,
    walletBalance: (walletByS[row.id] ?? 0) / 100,
  };
}

export async function fetchSponsors(): Promise<AdminSponsorRow[]> {
  if (!supabase) return [];
  const [sponsorRes, walletRes] = await Promise.all([
    supabase
      .from('sponsors')
      .select('id, name, email, phone, owner_name, district, gst_number, business_type, status, created_at, campaigns(spend_paise, status)')
      .order('created_at', { ascending: false }),
    supabase.from('wallets').select('sponsor_id, balance_paise'),
  ]);
  if (sponsorRes.error || !sponsorRes.data) return [];

  const walletByS: Record<string, number> = {};
  for (const w of walletRes.data ?? []) {
    walletByS[(w as any).sponsor_id] = Number((w as any).balance_paise || 0);
  }
  return sponsorRes.data.map((r) => rowToSponsor(r, walletByS));
}

export interface WalletTransactionRow {
  id: string;
  amountRupees: number;
  kind: string;
  reference: string;
  date: string;
}

export interface SponsorCampaignRow {
  id: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  spend: number;
  budget: number;
  districts: string[];
  startDate: string;
}

export interface SponsorInvoiceRow {
  id: string;
  invoiceNumber: string;
  type: string;
  amountRupees: number;
  gstRupees: number;
  totalRupees: number;
  pdfUrl: string | null;
  date: string;
}

export interface SponsorPaymentLinkRow {
  id: string;
  shortUrl: string;
  amountRupees: number;
  status: string;
  purpose: string;
  date: string;
}

export interface SponsorDetail {
  campaigns: SponsorCampaignRow[];
  transactions: WalletTransactionRow[];
  invoices: SponsorInvoiceRow[];
  paymentLinks: SponsorPaymentLinkRow[];
  walletBalance: number;
}

const EMPTY_DETAIL: SponsorDetail = {
  campaigns: [], transactions: [], invoices: [], paymentLinks: [], walletBalance: 0,
};

export async function fetchSponsorDetail(sponsorId: string): Promise<SponsorDetail> {
  if (!supabase) return EMPTY_DETAIL;
  const [campaigns, txns, invoices, links, wallet] = await Promise.all([
    supabase.from('campaigns').select('*').eq('sponsor_id', sponsorId).order('created_at', { ascending: false }),
    supabase.from('wallet_transactions').select('*').eq('sponsor_id', sponsorId).order('created_at', { ascending: false }).limit(100),
    supabase.from('invoices').select('*').eq('sponsor_id', sponsorId).order('created_at', { ascending: false }),
    supabase.from('payment_links').select('*').eq('sponsor_id', sponsorId).order('created_at', { ascending: false }),
    supabase.from('wallets').select('balance_paise').eq('sponsor_id', sponsorId).maybeSingle(),
  ]);

  return {
    campaigns: (campaigns.data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      impressions: c.impressions ?? 0,
      clicks: c.clicks ?? 0,
      spend: Number(c.spend_paise || 0) / 100,
      budget: Number(c.budget_paise || 0) / 100,
      districts: c.target_districts ?? [],
      startDate: c.start_date ? formatDate(c.start_date) : '—',
    })),
    transactions: (txns.data ?? []).map((t: any) => ({
      id: t.id,
      amountRupees: Number(t.amount_paise || 0) / 100,
      kind: t.kind,
      reference: t.reference ?? '',
      date: formatDateShort(t.created_at),
    })),
    invoices: (invoices.data ?? []).map((i: any) => ({
      id: i.id,
      invoiceNumber: i.invoice_number,
      type: i.type ?? 'wallet_topup',
      amountRupees: Number(i.amount_paise || 0) / 100,
      gstRupees: Number(i.gst_paise || 0) / 100,
      totalRupees: Number(i.total_paise || 0) / 100,
      pdfUrl: i.pdf_url ?? null,
      date: formatDate(i.created_at),
    })),
    paymentLinks: (links.data ?? []).map((l: any) => ({
      id: l.id,
      shortUrl: l.razorpay_short_url ?? '',
      amountRupees: Number(l.amount_paise || 0) / 100,
      status: l.status ?? 'created',
      purpose: l.purpose ?? 'wallet_topup',
      date: formatDate(l.created_at),
    })),
    walletBalance: Number((wallet.data as any)?.balance_paise || 0) / 100,
  };
}
