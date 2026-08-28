/**
 * Dashboard — the landing screen: what needs a decision right now, then how the
 * platform is doing.
 *
 * The "Needs attention" panel is the point of this screen. Counts alone make an
 * operator hunt for the queue; every card here navigates straight to it, so the
 * dashboard is a work list rather than a wall of numbers.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Users, Building2, IndianRupee, TrendingUp, Eye, MousePointerClick,
  Clapperboard, Tv, Radio, CheckSquare, Briefcase, Wallet, FileEdit,
  ArrowRight, RefreshCw, Film, Sparkles,
} from 'lucide-react';
import { fetchDashboardStats, compact, rupeesCompact, type DashboardStats } from '@/services/admin-stats';
import type { AdminPage } from './AdminApp';
import { StatCard, SkeletonCards, SkeletonTable, EmptyState } from '@/components/admin/ui';

export function AdminDashboard({ onNavigate }: { onNavigate?: (page: AdminPage) => void }) {
  const [s, setS] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setS(await fetchDashboardStats());
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!s) {
    return (
      <div className="space-y-5">
        <SkeletonCards count={4} />
        <SkeletonCards count={4} />
        <SkeletonTable rows={5} cols={3} />
      </div>
    );
  }

  /** Only surfaces a card when there is actually something to do. */
  const actions = [
    {
      show: s.pendingCampaigns > 0,
      page: 'approvals' as AdminPage,
      icon: CheckSquare,
      tone: 'gold',
      label: `${s.pendingCampaigns} campaign${s.pendingCampaigns === 1 ? '' : 's'} awaiting approval`,
      sub: 'Sponsors are waiting to go live',
    },
    {
      show: s.pendingFreelancerApps > 0,
      page: 'freelancers' as AdminPage,
      icon: Briefcase,
      tone: 'gold',
      label: `${s.pendingFreelancerApps} freelancer application${s.pendingFreelancerApps === 1 ? '' : 's'}`,
      sub: 'Review and approve to unlock their login',
    },
    {
      show: s.pendingPayouts > 0,
      page: 'freelancers' as AdminPage,
      icon: Wallet,
      tone: 'red',
      label: `${rupeesCompact(s.pendingPayouts)} in pending payouts`,
      sub: 'Approved work waiting on payment release',
    },
    {
      show: s.draftFeedReels > 0,
      page: 'feed' as AdminPage,
      icon: FileEdit,
      tone: 'blue',
      label: `${s.draftFeedReels} feed draft${s.draftFeedReels === 1 ? '' : 's'}`,
      sub: 'Not visible to viewers until published',
    },
    {
      show: !s.channelLive,
      page: 'broadcast' as AdminPage,
      icon: Radio,
      tone: 'grey',
      label: 'VALLAVAN TV is offline',
      sub: 'Viewers see the Coming Soon promo screen',
    },
  ].filter((a) => a.show);

  const toneClass: Record<string, string> = {
    gold: 'bg-vgold/10 border-vgold/30 text-vgold',
    red: 'bg-vred/10 border-vred/30 text-vred',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    grey: 'bg-white/5 border-white/15 text-white/70',
  };

  const maxRev = Math.max(1, ...s.revenueByWeek);

  return (
    <div className="space-y-5">
      {/* Needs attention */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-bold text-white">Needs attention</h3>
          <button
            onClick={load}
            disabled={refreshing}
            className="px-2.5 py-1.5 rounded-lg glass text-vmuted hover:text-white text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        {actions.length === 0 ? (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/25">
            <p className="text-sm font-semibold text-green-400">Everything is clear</p>
            <p className="text-[11px] text-white/70 mt-0.5">
              No pending approvals, applications or payouts. The channel is live.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate?.(a.page)}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition hover:brightness-125 active:scale-[0.99] ${toneClass[a.tone]}`}
              >
                <a.icon size={20} className="flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-white">{a.label}</div>
                  <div className="text-[10px] text-white/60">{a.sub}</div>
                </div>
                <ArrowRight size={15} className="flex-shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Money — two distinct numbers, never summed */}
      <section>
        <h3 className="text-sm font-bold text-white mb-2.5">Money</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <BigCard icon={IndianRupee} label="Top-up Revenue" hint="Cash received" value={rupeesCompact(s.topupRevenueRupees)} color="#D4AF37" />
          <BigCard icon={TrendingUp} label="Sponsor Spend" hint="Budget consumed" value={rupeesCompact(s.sponsorSpendRupees)} color="#D32F2F" />
          <BigCard icon={Wallet} label="Wallet Balances" hint="Unspent, owed to sponsors" value={rupeesCompact(s.walletBalanceRupees)} color="#1565C0" />
          <BigCard icon={Building2} label="Active Sponsors" value={String(s.activeSponsors)} color="#00838F" />
        </div>
      </section>

      {/* Content — Feed first, it is the live viewer surface */}
      <section>
        <h3 className="text-sm font-bold text-white mb-2.5">Content</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Feed Reels"
            value={`${s.publishedFeedReels} live`}
            accent="text-green-400"
            icon={<Clapperboard size={13} />}
          />
          <StatCard label="Live Slots Today" value={s.liveSlotsToday} icon={<Tv size={13} />} accent={s.liveSlotsToday === 0 ? 'text-vgold' : 'text-white'} />
          <StatCard label="Documentaries" value={s.documentaries} icon={<Film size={13} />} />
          <StatCard label="Inspire Items" value={s.inspireItems} icon={<Sparkles size={13} />} />
        </div>
      </section>

      {/* Audience + delivery */}
      <section>
        <h3 className="text-sm font-bold text-white mb-2.5">Audience & delivery</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={s.users.toLocaleString('en-IN')} icon={<Users size={13} />} />
          <StatCard label="New Users (7d)" value={s.newUsers7d} accent="text-green-400" />
          <StatCard label="Total Views" value={compact(s.views)} icon={<Eye size={13} />} accent="text-blue-400" />
          <StatCard
            label="Ad CTR"
            value={s.impressions > 0 ? `${s.ctr.toFixed(2)}%` : '—'}
            icon={<MousePointerClick size={13} />}
            accent="text-vgold"
          />
        </div>
      </section>

      {/* Revenue chart */}
      <div className="p-5 rounded-xl glass">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Wallet Top-ups Over Time</h3>
            <p className="text-[10px] text-vmuted">Last 12 weeks — cash received, not spend</p>
          </div>
          <span className="text-sm font-black text-vgold">{rupeesCompact(s.revenueByWeek.reduce((a, b) => a + b, 0))}</span>
        </div>
        {s.revenueByWeek.every((v) => v === 0) ? (
          <p className="text-xs text-vmuted py-6 text-center">No top-ups recorded in the last 12 weeks.</p>
        ) : (
          <div className="flex items-end justify-between gap-2 h-40">
            {s.revenueByWeek.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-vred to-vgold"
                  style={{ height: `${Math.max(2, (v / maxRev) * 100)}%` }}
                  title={rupeesCompact(v)}
                />
                <span className="text-[9px] text-vmuted">W{i + 1}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="p-5 rounded-xl glass">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Recent Admin Activity</h3>
          {onNavigate && (
            <button onClick={() => onNavigate('audit')} className="text-[11px] font-bold text-vgold flex items-center gap-1">
              Full log <ArrowRight size={11} />
            </button>
          )}
        </div>
        {s.recentActivity.length === 0 ? (
          <EmptyState title="No activity recorded yet" hint="Every admin action writes an audit entry." />
        ) : (
          <div className="space-y-2.5">
            {s.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/90 min-w-0 truncate">{a.text}</span>
                <span className="text-[10px] text-vmuted flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BigCard({
  icon: Icon, label, value, color, hint,
}: { icon: typeof Users; label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="p-4 rounded-xl glass">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="text-2xl font-black text-white mt-3">{value}</div>
      <div className="text-[11px] text-vmuted mt-0.5">{label}</div>
      {hint && <div className="text-[9px] text-vmuted/70 mt-0.5">{hint}</div>}
    </div>
  );
}
