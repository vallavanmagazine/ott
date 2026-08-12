/**
 * Admin dashboard + revenue aggregates — all real, from Supabase.
 * Counts use head+exact; sums fetch the needed columns and reduce client-side.
 * Everything degrades to zeros/empty on error so the dashboard never breaks.
 */
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  users: number;
  documentaries: number;
  activeSponsors: number;
  revenueRupees: number;
  views: number;
  clicks: number;
  impressions: number;
  ctr: number;
  newUsers7d: number;
  revenueByWeek: number[];        // last 12 weeks, rupees
  recentActivity: { text: string; time: string }[];
}

const EMPTY: DashboardStats = {
  users: 0, documentaries: 0, activeSponsors: 0, revenueRupees: 0,
  views: 0, clicks: 0, impressions: 0, ctr: 0, newUsers7d: 0,
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

    const [
      users, documentaries, activeSponsors, newUsers7d,
      campaignsRes, docsViewsRes, walletRes, auditRes,
    ] = await Promise.all([
      count('app_users'),
      count('documentaries'),
      count('sponsors', (q) => q.eq('status', 'Active')),
      count('app_users', (q) => q.gte('created_at', weekAgo)),
      supabase.from('campaigns').select('spend_paise, clicks, impressions'),
      supabase.from('documentaries').select('views'),
      supabase.from('wallet_transactions').select('amount_paise, kind, created_at'),
      supabase.from('audit_logs').select('action, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const campaigns = campaignsRes.data ?? [];
    const revenueRupees = campaigns.reduce((s: number, c: any) => s + Number(c.spend_paise || 0), 0) / 100;
    const clicks = campaigns.reduce((s: number, c: any) => s + Number(c.clicks || 0), 0);
    const impressions = campaigns.reduce((s: number, c: any) => s + Number(c.impressions || 0), 0);
    const views = (docsViewsRes.data ?? []).reduce((s: number, d: any) => s + Number(d.views || 0), 0);

    // Revenue by week (last 12 weeks) from wallet top-ups/credits.
    const revenueByWeek = new Array(12).fill(0);
    const now = Date.now();
    for (const t of walletRes.data ?? []) {
      const amt = Number((t as any).amount_paise || 0);
      if (amt <= 0) continue;
      const weeksAgo = Math.floor((now - new Date((t as any).created_at).getTime()) / (7 * 86400000));
      if (weeksAgo >= 0 && weeksAgo < 12) revenueByWeek[11 - weeksAgo] += amt / 100;
    }

    const recentActivity = (auditRes.data ?? []).map((a: any) => ({ text: a.action, time: timeAgo(a.created_at) }));

    return {
      users, documentaries, activeSponsors, revenueRupees, views, clicks, impressions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      newUsers7d, revenueByWeek, recentActivity,
    };
  } catch {
    return EMPTY;
  }
}

export interface RevenueReport {
  totalRupees: number;
  thisMonthRupees: number;
  byMonth: { label: string; rupees: number }[];
  topSponsors: { name: string; rupees: number }[];
}

export async function fetchRevenueReport(): Promise<RevenueReport> {
  const empty: RevenueReport = { totalRupees: 0, thisMonthRupees: 0, byMonth: [], topSponsors: [] };
  if (!supabase) return empty;
  try {
    const [{ data: campaigns }, { data: sponsors }] = await Promise.all([
      supabase.from('campaigns').select('spend_paise, sponsor_id, created_at'),
      supabase.from('sponsors').select('id, name'),
    ]);
    const camps = campaigns ?? [];
    const nameById: Record<string, string> = Object.fromEntries((sponsors ?? []).map((s: any) => [s.id, s.name]));

    const totalRupees = camps.reduce((sum: number, c: any) => sum + Number(c.spend_paise || 0), 0) / 100;

    const now = new Date();
    const thisMonthRupees = camps.reduce((sum: number, c: any) => {
      const d = new Date(c.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? sum + Number(c.spend_paise || 0) : sum;
    }, 0) / 100;

    // Last 8 months
    const byMonth: { label: string; rupees: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const rupees = camps.reduce((sum: number, c: any) => {
        const cd = new Date(c.created_at);
        return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
          ? sum + Number(c.spend_paise || 0) : sum;
      }, 0) / 100;
      byMonth.push({ label, rupees });
    }

    const bySponsor: Record<string, number> = {};
    for (const c of camps) {
      const id = (c as any).sponsor_id;
      if (!id) continue;
      bySponsor[id] = (bySponsor[id] ?? 0) + Number((c as any).spend_paise || 0) / 100;
    }
    const topSponsors = Object.entries(bySponsor)
      .map(([id, rupees]) => ({ name: nameById[id] ?? 'Unknown', rupees }))
      .sort((a, b) => b.rupees - a.rupees).slice(0, 5);

    return { totalRupees, thisMonthRupees, byMonth, topSponsors };
  } catch {
    return empty;
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
