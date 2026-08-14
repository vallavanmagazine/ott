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
