/**
 * Admin dashboard + revenue aggregates — all real, from Supabase.
 * Counts use head+exact; sums fetch the needed columns and reduce client-side.
 * Everything degrades to zeros/empty on error so the dashboard never breaks.
 *
 * TWO DIFFERENT MONEY NUMBERS, deliberately kept apart:
 *   - topupRevenueRupees  cash the platform actually received (wallet top-ups)
 *   - sponsorSpendRupees  budget campaigns have burned through
 * They are not interchangeable and must never be summed: spend is funded by an
 * earlier top-up, so adding them double-counts. Screens label which one they
 * show rather than both saying "revenue".
 */
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  users: number;
  newUsers7d: number;
  activeSponsors: number;
  // Content
  feedReels: number;
  publishedFeedReels: number;
  documentaries: number;
  inspireItems: number;
  liveSlotsToday: number;
  // Money
  topupRevenueRupees: number;
  sponsorSpendRupees: number;
  walletBalanceRupees: number;
  // Delivery
  views: number;
  clicks: number;
  impressions: number;
  ctr: number;
  // Needs attention
  pendingCampaigns: number;
  pendingFreelancerApps: number;
  pendingPayouts: number;
  draftFeedReels: number;
  channelLive: boolean;
  // Series
  revenueByWeek: number[];        // last 12 weeks, rupees (top-ups only)
  recentActivity: { text: string; time: string }[];
}

const EMPTY: DashboardStats = {
  users: 0, newUsers7d: 0, activeSponsors: 0,
  feedReels: 0, publishedFeedReels: 0, documentaries: 0, inspireItems: 0, liveSlotsToday: 0,
  topupRevenueRupees: 0, sponsorSpendRupees: 0, walletBalanceRupees: 0,
  views: 0, clicks: 0, impressions: 0, ctr: 0,
  pendingCampaigns: 0, pendingFreelancerApps: 0, pendingPayouts: 0, draftFeedReels: 0,
  channelLive: false,
  revenueByWeek: new Array(12).fill(0), recentActivity: [],
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day === 1) return '1d ago';
  return `${day}d ago`;
}

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  if (!supabase) return 0;
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  if (!supabase) return EMPTY;
  try {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const today = new Date().toISOString().slice(0, 10);

    const [
      users, newUsers7d, activeSponsors,
      feedReels, publishedFeedReels, draftFeedReels, documentaries, inspireItems, liveSlotsToday,
      pendingCampaigns, pendingFreelancerApps,
      campaignsRes, feedViewsRes, docViewsRes, walletRes, walletBalRes, earningsRes, auditRes, broadcastRes,
    ] = await Promise.all([
      count('app_users'),
      count('app_users', (q) => q.gte('created_at', weekAgo)),
      count('sponsors', (q) => q.eq('status', 'Active')),
      count('feed_reels'),
      count('feed_reels', (q) => q.eq('status', 'Published')),
      count('feed_reels', (q) => q.eq('status', 'Draft')),
      count('documentaries'),
      count('inspire_items'),
      count('live_slots', (q) => q.eq('air_date', today)),
      count('campaigns', (q) => q.eq('status', 'Pending Approval')),
      count('freelancers', (q) => q.eq('status', 'pending')),
      supabase.from('campaigns').select('spend_paise, clicks, impressions'),
      supabase.from('feed_reels').select('views'),
      supabase.from('documentaries').select('views'),
      supabase.from('wallet_transactions').select('amount_paise, kind, created_at'),
      supabase.from('wallets').select('balance_paise'),
      supabase.from('freelancer_earnings').select('amount_paise, status'),
      supabase.from('audit_logs').select('action, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('broadcast_config').select('channel_live').eq('id', 1).maybeSingle(),
    ]);

    const campaigns = campaignsRes.data ?? [];
    const sponsorSpendRupees = campaigns.reduce((s: number, c: any) => s + Number(c.spend_paise || 0), 0) / 100;
    const clicks = campaigns.reduce((s: number, c: any) => s + Number(c.clicks || 0), 0);
    const impressions = campaigns.reduce((s: number, c: any) => s + Number(c.impressions || 0), 0);

    // Feed is the primary viewer surface, so its views belong in the headline.
    const views =
      (feedViewsRes.data ?? []).reduce((s: number, r: any) => s + Number(r.views || 0), 0)
      + (docViewsRes.data ?? []).reduce((s: number, r: any) => s + Number(r.views || 0), 0);

    const topups = (walletRes.data ?? []).filter((t: any) => t.kind === 'topup' && Number(t.amount_paise || 0) > 0);
    const topupRevenueRupees = topups.reduce((s: number, t: any) => s + Number(t.amount_paise || 0), 0) / 100;

    const revenueByWeek = new Array(12).fill(0);
    const now = Date.now();
    for (const t of topups) {
      const weeksAgo = Math.floor((now - new Date((t as any).created_at).getTime()) / (7 * 86400000));
      if (weeksAgo >= 0 && weeksAgo < 12) revenueByWeek[11 - weeksAgo] += Number((t as any).amount_paise || 0) / 100;
    }

    const walletBalanceRupees = (walletBalRes.data ?? []).reduce((s: number, w: any) => s + Number(w.balance_paise || 0), 0) / 100;
    const pendingPayouts = (earningsRes.data ?? [])
      .filter((e: any) => e.status !== 'paid')
      .reduce((s: number, e: any) => s + Number(e.amount_paise || 0), 0) / 100;

    return {
      users, newUsers7d, activeSponsors,
      feedReels, publishedFeedReels, draftFeedReels, documentaries, inspireItems, liveSlotsToday,
      topupRevenueRupees, sponsorSpendRupees, walletBalanceRupees,
      views, clicks, impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      pendingCampaigns, pendingFreelancerApps, pendingPayouts,
      channelLive: (broadcastRes.data as any)?.channel_live === true,
      revenueByWeek,
      recentActivity: (auditRes.data ?? []).map((a: any) => ({ text: a.action, time: timeAgo(a.created_at) })),
    };
  } catch {
    return EMPTY;
  }
}

// ---------------------------------------------------------------------------
// Revenue report
// ---------------------------------------------------------------------------
export interface RevenueMonth {
  label: string;
  /** Wallet top-ups received that month — cash in. */
  topupRupees: number;
  /** Campaign budget burned that month — inventory consumed. */
  spendRupees: number;
}

export interface RevenueSponsorRow {
  name: string;
  spendRupees: number;
  topupRupees: number;
  campaigns: number;
}

export interface RevenueReport {
  topupRupees: number;
  spendRupees: number;
  invoicedRupees: number;
  gstRupees: number;
  walletLiabilityRupees: number;
  thisMonthTopupRupees: number;
  lastMonthTopupRupees: number;
  byMonth: RevenueMonth[];
  topSponsors: RevenueSponsorRow[];
}

const EMPTY_REPORT: RevenueReport = {
  topupRupees: 0, spendRupees: 0, invoicedRupees: 0, gstRupees: 0, walletLiabilityRupees: 0,
  thisMonthTopupRupees: 0, lastMonthTopupRupees: 0, byMonth: [], topSponsors: [],
};

/** yyyy-mm key so month bucketing never collides across years. */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function fetchRevenueReport(): Promise<RevenueReport> {
  if (!supabase) return EMPTY_REPORT;
  try {
    const [campaignsRes, sponsorsRes, txnRes, invoiceRes, walletRes] = await Promise.all([
      supabase.from('campaigns').select('spend_paise, sponsor_id, created_at'),
      supabase.from('sponsors').select('id, name'),
      supabase.from('wallet_transactions').select('amount_paise, kind, sponsor_id, created_at'),
      supabase.from('invoices').select('amount_paise, gst_paise, total_paise'),
      supabase.from('wallets').select('balance_paise'),
    ]);

    const camps = campaignsRes.data ?? [];
    const nameById: Record<string, string> = Object.fromEntries(
      (sponsorsRes.data ?? []).map((s: any) => [s.id, s.name]),
    );
    const topups = (txnRes.data ?? []).filter((t: any) => t.kind === 'topup' && Number(t.amount_paise || 0) > 0);

    const spendRupees = camps.reduce((s: number, c: any) => s + Number(c.spend_paise || 0), 0) / 100;
    const topupRupees = topups.reduce((s: number, t: any) => s + Number(t.amount_paise || 0), 0) / 100;
    const invoicedRupees = (invoiceRes.data ?? []).reduce((s: number, i: any) => s + Number(i.total_paise || 0), 0) / 100;
    const gstRupees = (invoiceRes.data ?? []).reduce((s: number, i: any) => s + Number(i.gst_paise || 0), 0) / 100;
    const walletLiabilityRupees = (walletRes.data ?? []).reduce((s: number, w: any) => s + Number(w.balance_paise || 0), 0) / 100;

    // Last 8 months, keyed yyyy-mm.
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: monthKey(d), label: d.toLocaleDateString('en-US', { month: 'short' }) });
    }

    const topupByMonth: Record<string, number> = {};
    for (const t of topups) {
      const key = monthKey(new Date((t as any).created_at));
      topupByMonth[key] = (topupByMonth[key] ?? 0) + Number((t as any).amount_paise || 0) / 100;
    }
    const spendByMonth: Record<string, number> = {};
    for (const c of camps) {
      const key = monthKey(new Date((c as any).created_at));
      spendByMonth[key] = (spendByMonth[key] ?? 0) + Number((c as any).spend_paise || 0) / 100;
    }

    const byMonth: RevenueMonth[] = months.map((m) => ({
      label: m.label,
      topupRupees: topupByMonth[m.key] ?? 0,
      spendRupees: spendByMonth[m.key] ?? 0,
    }));

    const thisKey = monthKey(now);
    const lastKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

    // Per-sponsor: spend from campaigns, top-ups from the wallet ledger.
    const spendBySponsor: Record<string, number> = {};
    const countBySponsor: Record<string, number> = {};
    for (const c of camps) {
      const id = (c as any).sponsor_id;
      if (!id) continue;
      spendBySponsor[id] = (spendBySponsor[id] ?? 0) + Number((c as any).spend_paise || 0) / 100;
      countBySponsor[id] = (countBySponsor[id] ?? 0) + 1;
    }
    const topupBySponsor: Record<string, number> = {};
    for (const t of topups) {
      const id = (t as any).sponsor_id;
      if (!id) continue;
      topupBySponsor[id] = (topupBySponsor[id] ?? 0) + Number((t as any).amount_paise || 0) / 100;
    }

    const sponsorIds = new Set([...Object.keys(spendBySponsor), ...Object.keys(topupBySponsor)]);
    const topSponsors: RevenueSponsorRow[] = [...sponsorIds]
      .map((id) => ({
        name: nameById[id] ?? 'Unknown',
        spendRupees: spendBySponsor[id] ?? 0,
        topupRupees: topupBySponsor[id] ?? 0,
        campaigns: countBySponsor[id] ?? 0,
      }))
      .sort((a, b) => (b.topupRupees + b.spendRupees) - (a.topupRupees + a.spendRupees));

    return {
      topupRupees, spendRupees, invoicedRupees, gstRupees, walletLiabilityRupees,
      thisMonthTopupRupees: topupByMonth[thisKey] ?? 0,
      lastMonthTopupRupees: topupByMonth[lastKey] ?? 0,
      byMonth, topSponsors,
    };
  } catch {
    return EMPTY_REPORT;
  }
}

// --- Formatting helpers (shared by dashboard + revenue) ---
export function compact(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}
export function rupeesCompact(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}
