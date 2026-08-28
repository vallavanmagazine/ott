/**
 * Platform analytics (Section D8). Aggregates revenue, sponsors, campaigns,
 * freelancers, and content counts for the admin analytics dashboard. All reads
 * are admin-gated by RLS.
 */
import { supabase } from '@/lib/supabase';

export interface PlatformAnalytics {
  sponsors: number;
  activeCampaigns: number;
  walletBalanceRupees: number;
  topupRevenueRupees: number;
  invoiceRevenueRupees: number;
  freelancers: number;
  pendingFreelancers: number;
  inspireOrders: number;
  adSalesCommissionRupees: number;
  monthlyRevenue: { month: string; rupees: number }[];
}

const EMPTY: PlatformAnalytics = {
  sponsors: 0, activeCampaigns: 0, walletBalanceRupees: 0, topupRevenueRupees: 0,
  invoiceRevenueRupees: 0, freelancers: 0, pendingFreelancers: 0, inspireOrders: 0,
  adSalesCommissionRupees: 0, monthlyRevenue: [],
};

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  if (!supabase) return 0;
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

export async function fetchPlatformAnalytics(): Promise<PlatformAnalytics> {
  if (!supabase) return EMPTY;
  try {
    const [sponsors, activeCampaigns, freelancers, pendingFreelancers, inspireOrders] = await Promise.all([
      count('sponsors'),
      count('campaigns', (q) => q.eq('status', 'Active')),
      count('freelancers'),
      count('freelancers', (q) => q.eq('status', 'pending')),
      count('inspire_orders'),
    ]);

    const [{ data: wallets }, { data: topups }, { data: invoices }, { data: adSales }] = await Promise.all([
      supabase.from('wallets').select('balance_paise'),
      supabase.from('wallet_transactions').select('amount_paise, created_at').eq('kind', 'topup'),
      supabase.from('invoices').select('total_paise'),
      supabase.from('ad_sales_log').select('commission_paise'),
    ]);

    const walletBalanceRupees = (wallets ?? []).reduce((s: number, w: any) => s + Number(w.balance_paise ?? 0), 0) / 100;
    const topupRevenueRupees = (topups ?? []).reduce((s: number, t: any) => s + Number(t.amount_paise ?? 0), 0) / 100;
    const invoiceRevenueRupees = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.total_paise ?? 0), 0) / 100;
    const adSalesCommissionRupees = (adSales ?? []).reduce((s: number, a: any) => s + Number(a.commission_paise ?? 0), 0) / 100;

    // Monthly top-up revenue for the last 6 months
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(d.toLocaleString('en-US', { month: 'short' }), 0);
    }
    for (const t of topups ?? []) {
      if (!t.created_at) continue;
      const key = new Date(t.created_at).toLocaleString('en-US', { month: 'short' });
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + Number(t.amount_paise ?? 0) / 100);
    }
    const monthlyRevenue = Array.from(buckets.entries()).map(([month, rupees]) => ({ month, rupees }));

    return {
      sponsors, activeCampaigns, walletBalanceRupees, topupRevenueRupees, invoiceRevenueRupees,
      freelancers, pendingFreelancers, inspireOrders, adSalesCommissionRupees, monthlyRevenue,
    };
  } catch {
    return EMPTY;
  }
}

// ---------------------------------------------------------------------------
// Deep-dive views: users, content, sponsors
// ---------------------------------------------------------------------------

export interface AudienceStats {
  totalUsers: number;
  viewers: number;
  sponsors: number;
  creators: number;
  admins: number;
  freelancers: number;
  newUsers30d: number;
  /** month label -> cumulative user count, last 6 months */
  growth: { month: string; users: number }[];
}

const EMPTY_AUDIENCE: AudienceStats = {
  totalUsers: 0, viewers: 0, sponsors: 0, creators: 0, admins: 0,
  freelancers: 0, newUsers30d: 0, growth: [],
};

export async function fetchAudienceStats(): Promise<AudienceStats> {
  if (!supabase) return EMPTY_AUDIENCE;
  try {
    const [{ data: users }, freelancers] = await Promise.all([
      supabase.from('app_users').select('role, created_at'),
      count('freelancers', (q) => q.eq('status', 'approved')),
    ]);
    const rows = (users ?? []) as any[];
    const cutoff = Date.now() - 30 * 86400_000;

    // Cumulative growth: users existing at the end of each of the last 6 months.
    const growth: { month: string; users: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      growth.push({
        month: new Date(now.getFullYear(), now.getMonth() - i, 1).toLocaleString('en-US', { month: 'short' }),
        users: rows.filter((r) => new Date(r.created_at).getTime() < end).length,
      });
    }

    return {
      totalUsers: rows.length,
      viewers: rows.filter((r) => r.role === 'Viewer').length,
      sponsors: rows.filter((r) => r.role === 'Sponsor').length,
      creators: rows.filter((r) => r.role === 'Creator').length,
      admins: rows.filter((r) => r.role === 'Admin').length,
      freelancers,
      newUsers30d: rows.filter((r) => new Date(r.created_at).getTime() >= cutoff).length,
      growth,
    };
  } catch {
    return EMPTY_AUDIENCE;
  }
}

export interface ContentStats {
  feedReels: number;
  documentaries: number;
  inspireItems: number;
  liveSlots: number;
  topContent: { title: string; type: string; views: number }[];
  byGenre: { name: string; count: number }[];
}

const EMPTY_CONTENT: ContentStats = {
  feedReels: 0, documentaries: 0, inspireItems: 0, liveSlots: 0, topContent: [], byGenre: [],
};

export async function fetchContentStats(): Promise<ContentStats> {
  if (!supabase) return EMPTY_CONTENT;
  try {
    const [feed, docs, inspire, live] = await Promise.all([
      supabase.from('feed_reels').select('title, views, genre'),
      supabase.from('documentaries').select('title, views, genre'),
      supabase.from('inspire_items').select('title, category'),
      count('live_slots'),
    ]);

    const feedRows = (feed.data ?? []) as any[];
    const docRows = (docs.data ?? []) as any[];
    const inspireRows = (inspire.data ?? []) as any[];

    const topContent = [
      ...feedRows.map((r) => ({ title: r.title, type: 'Feed', views: r.views ?? 0 })),
      ...docRows.map((r) => ({ title: r.title, type: 'Documentary', views: r.views ?? 0 })),
    ].sort((a, b) => b.views - a.views).slice(0, 10);

    const genreCounts = new Map<string, number>();
    for (const r of [...feedRows, ...docRows]) {
      if (!r.genre) continue;
      genreCounts.set(r.genre, (genreCounts.get(r.genre) ?? 0) + 1);
    }
    for (const r of inspireRows) {
      if (!r.category) continue;
      genreCounts.set(r.category, (genreCounts.get(r.category) ?? 0) + 1);
    }

    return {
      feedReels: feedRows.length,
      documentaries: docRows.length,
      inspireItems: inspireRows.length,
      liveSlots: live,
      topContent,
      byGenre: [...genreCounts.entries()].map(([name, c]) => ({ name, count: c })).sort((a, b) => b.count - a.count),
    };
  } catch {
    return EMPTY_CONTENT;
  }
}

export interface SponsorSpendRow {
  name: string;
  spendRupees: number;
  campaigns: number;
  active: boolean;
}

export async function fetchSponsorSpend(): Promise<SponsorSpendRow[]> {
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('sponsors').select('name, status, campaigns(spend_paise, status)');
    return ((data ?? []) as any[])
      .map((s) => {
        const rows: any[] = Array.isArray(s.campaigns) ? s.campaigns : [];
        return {
          name: s.name,
          spendRupees: rows.reduce((sum, c) => sum + Number(c.spend_paise || 0), 0) / 100,
          campaigns: rows.length,
          active: s.status === 'Active',
        };
      })
      .sort((a, b) => b.spendRupees - a.spendRupees);
  } catch {
    return [];
  }
}
