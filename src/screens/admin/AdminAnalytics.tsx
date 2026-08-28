/**
 * Analytics — four views over the same live tables: platform overview,
 * campaigns, sponsors and content.
 *
 * Everything is aggregated client-side from the admin reads. PostgREST has no
 * GROUP BY, so a server-side rollup would need RPCs we do not have yet; at the
 * platform's current row counts (thousands, not millions) this is the simpler
 * trade and keeps the numbers honest rather than cached.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Megaphone, Wallet, IndianRupee, Users, Sparkles, Percent, FileText,
  Film, Clapperboard, Tv, TrendingUp,
} from 'lucide-react';
import {
  fetchPlatformAnalytics, fetchAudienceStats, fetchContentStats, fetchSponsorSpend,
  type PlatformAnalytics, type AudienceStats, type ContentStats, type SponsorSpendRow,
} from '@/services/admin-analytics';
import { fetchAllCampaigns, ctr, type AdminCampaignRow } from '@/services/admin-campaigns';
import { rupeesCompactINR, rupees, compactCount } from '@/lib/admin-options';
import { downloadCsv, datedFilename } from '@/lib/csv';
import { useToast } from '@/components/admin/Toast';
import { StatCard, SkeletonCards, SkeletonTable, EmptyState, Tabs, StatusPill } from '@/components/admin/ui';

type Tab = 'overview' | 'campaigns' | 'sponsors' | 'content';

export function AdminAnalytics() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');

  const [platform, setPlatform] = useState<PlatformAnalytics | null>(null);
  const [audience, setAudience] = useState<AudienceStats | null>(null);
  const [content, setContent] = useState<ContentStats | null>(null);
  const [sponsors, setSponsors] = useState<SponsorSpendRow[] | null>(null);
  const [campaigns, setCampaigns] = useState<AdminCampaignRow[] | null>(null);

  useEffect(() => {
    fetchPlatformAnalytics().then(setPlatform).catch(() => setPlatform(null));
    fetchAudienceStats().then(setAudience).catch(() => setAudience(null));
    fetchContentStats().then(setContent).catch(() => setContent(null));
    fetchSponsorSpend().then(setSponsors).catch(() => setSponsors([]));
    fetchAllCampaigns().then(setCampaigns).catch(() => setCampaigns([]));
  }, []);

  const campaignTotals = useMemo(() => {
    const list = campaigns ?? [];
    const impressions = list.reduce((s, c) => s + c.impressions, 0);
    const clicks = list.reduce((s, c) => s + c.clicks, 0);
    return {
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      spend: list.reduce((s, c) => s + c.spend, 0),
      budget: list.reduce((s, c) => s + c.budget, 0),
    };
  }, [campaigns]);

  const exportCampaigns = () => {
    downloadCsv(
      datedFilename('vallavan-campaign-analytics'),
      ['Campaign', 'Sponsor', 'Status', 'Impressions', 'Clicks', 'CTR %', 'Spend', 'Budget', 'Districts'],
      (campaigns ?? []).map((c) => [
        c.name, c.sponsorName, c.status, c.impressions, c.clicks, ctr(c).toFixed(2),
        c.spend, c.budget, c.districts.length === 0 ? 'All TN' : c.districts.join(' | '),
      ]),
    );
    toast.success('Campaign analytics exported');
  };

  return (
    <div className="space-y-5">
      <Tabs<Tab>
        tabs={[
          { key: 'overview', label: 'Platform' },
          { key: 'campaigns', label: 'Campaigns' },
          { key: 'sponsors', label: 'Sponsors' },
          { key: 'content', label: 'Content' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ------------------------------------------------------------ PLATFORM */}
      {tab === 'overview' && (
        !platform || !audience || !content ? <SkeletonCards count={8} /> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile icon={IndianRupee} label="Top-up Revenue" value={rupeesCompactINR(platform.topupRevenueRupees)} color="#D4AF37" />
              <Tile icon={FileText} label="Invoiced Revenue" value={rupeesCompactINR(platform.invoiceRevenueRupees)} color="#00838F" />
              <Tile icon={Wallet} label="Wallet Balances" value={rupeesCompactINR(platform.walletBalanceRupees)} color="#1565C0" />
              <Tile icon={Percent} label="Ad-sales Commission" value={rupeesCompactINR(platform.adSalesCommissionRupees)} color="#00695C" />
              <Tile icon={Users} label="Total Users" value={String(audience.totalUsers)} color="#2E7D32" />
              <Tile icon={Building2} label="Sponsors" value={String(platform.sponsors)} color="#D32F2F" />
              <Tile icon={Megaphone} label="Active Campaigns" value={String(platform.activeCampaigns)} color="#7B1FA2" />
              <Tile icon={Sparkles} label="Inspire Orders" value={String(platform.inspireOrders)} color="#EF6C00" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Viewers" value={audience.viewers} icon={<Users size={13} />} />
              <StatCard label="Freelancers" value={`${audience.freelancers} (${platform.pendingFreelancers} pending)`} accent="text-green-400" />
              <StatCard label="New users (30d)" value={audience.newUsers30d} accent="text-blue-400" />
              <StatCard label="Content items" value={content.feedReels + content.documentaries + content.inspireItems} accent="text-vgold" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <ChartCard title="Top-up Revenue — last 6 months">
                <BarRow
                  data={platform.monthlyRevenue.map((m) => ({ label: m.month, value: m.rupees }))}
                  format={(v) => rupeesCompactINR(v)}
                />
              </ChartCard>
              <ChartCard title="User Growth — last 6 months">
                <BarRow
                  data={audience.growth.map((g) => ({ label: g.month, value: g.users }))}
                  format={(v) => String(v)}
                  gradient="from-blue-500 to-cyan-400"
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Feed Reels" value={content.feedReels} icon={<Clapperboard size={13} />} />
              <StatCard label="Documentaries" value={content.documentaries} icon={<Film size={13} />} />
              <StatCard label="Inspire Items" value={content.inspireItems} icon={<Sparkles size={13} />} />
              <StatCard label="Live Slots" value={content.liveSlots} icon={<Tv size={13} />} />
            </div>
          </>
        )
      )}

      {/* ----------------------------------------------------------- CAMPAIGNS */}
      {tab === 'campaigns' && (
        !campaigns ? <SkeletonTable rows={6} cols={5} /> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Impressions" value={compactCount(campaignTotals.impressions)} />
              <StatCard label="Clicks" value={compactCount(campaignTotals.clicks)} accent="text-green-400" />
              <StatCard label="Blended CTR" value={`${campaignTotals.ctr.toFixed(2)}%`} accent="text-blue-400" />
              <StatCard label="Spend / Budget" value={`${rupeesCompactINR(campaignTotals.spend)} / ${rupeesCompactINR(campaignTotals.budget)}`} accent="text-vgold" />
            </div>

            <div className="flex justify-end">
              <button onClick={exportCampaigns} className="px-3 py-2 rounded-lg glass text-white text-xs font-bold active:scale-95">
                Export CSV
              </button>
            </div>

            {campaigns.length === 0 ? <EmptyState title="No campaigns yet" /> : (
              <div className="rounded-xl glass overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                      <th className="text-left px-4 py-3 font-bold">Campaign</th>
                      <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                      <th className="text-left px-4 py-3 font-bold">Status</th>
                      <th className="text-right px-4 py-3 font-bold">Impressions</th>
                      <th className="text-right px-4 py-3 font-bold">Clicks</th>
                      <th className="text-right px-4 py-3 font-bold">CTR</th>
                      <th className="text-right px-4 py-3 font-bold">Spend</th>
                      <th className="text-right px-4 py-3 font-bold">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[...campaigns].sort((a, b) => b.impressions - a.impressions).map((c) => (
                      <tr key={c.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate">{c.name}</td>
                        <td className="px-4 py-3 text-vmuted">{c.sponsorName}</td>
                        <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                        <td className="px-4 py-3 text-right text-white tabular-nums">{c.impressions.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-vmuted tabular-nums">{c.clicks.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-blue-400 tabular-nums">{ctr(c).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-right text-vgold font-bold tabular-nums">{rupees(c.spend)}</td>
                        <td className="px-4 py-3 text-right text-vmuted tabular-nums">{rupees(Math.max(0, c.budget - c.spend))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}

      {/* ------------------------------------------------------------ SPONSORS */}
      {tab === 'sponsors' && (
        !sponsors ? <SkeletonTable rows={6} cols={4} /> : sponsors.length === 0 ? (
          <EmptyState title="No sponsors yet" />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Sponsors" value={sponsors.length} icon={<Building2 size={13} />} />
              <StatCard label="Active" value={sponsors.filter((s) => s.active).length} accent="text-green-400" />
              <StatCard label="Inactive" value={sponsors.filter((s) => !s.active).length} accent="text-vgold" />
              <StatCard label="Total Spend" value={rupeesCompactINR(sponsors.reduce((s, x) => s + x.spendRupees, 0))} accent="text-vgold" />
            </div>

            <ChartCard title="Top Sponsors by Spend">
              <HBar
                data={sponsors.slice(0, 10).map((s) => ({ label: s.name, value: s.spendRupees }))}
                format={rupees}
              />
            </ChartCard>

            <div className="rounded-xl glass overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                    <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                    <th className="text-left px-4 py-3 font-bold">Status</th>
                    <th className="text-right px-4 py-3 font-bold">Campaigns</th>
                    <th className="text-right px-4 py-3 font-bold">Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sponsors.map((s) => (
                    <tr key={s.name} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-semibold text-white">{s.name}</td>
                      <td className="px-4 py-3"><StatusPill status={s.active ? 'Active' : 'Inactive'} /></td>
                      <td className="px-4 py-3 text-right text-vmuted tabular-nums">{s.campaigns}</td>
                      <td className="px-4 py-3 text-right text-vgold font-bold tabular-nums">{rupees(s.spendRupees)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* ------------------------------------------------------------- CONTENT */}
      {tab === 'content' && (
        !content ? <SkeletonTable rows={6} cols={3} /> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Feed Reels" value={content.feedReels} icon={<Clapperboard size={13} />} />
              <StatCard label="Documentaries" value={content.documentaries} icon={<Film size={13} />} />
              <StatCard label="Inspire Items" value={content.inspireItems} icon={<Sparkles size={13} />} />
              <StatCard label="Live Slots" value={content.liveSlots} icon={<Tv size={13} />} />
            </div>

            <ChartCard title="Content by Genre / Category">
              {content.byGenre.length === 0 ? <p className="text-xs text-vmuted">No content yet.</p> : (
                <HBar data={content.byGenre.map((g) => ({ label: g.name, value: g.count }))} format={String} />
              )}
            </ChartCard>

            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-vgold" /> Most Viewed
              </h3>
              {content.topContent.length === 0 ? <EmptyState title="No view data yet" /> : (
                <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
                  {content.topContent.map((c, i) => (
                    <div key={`${c.type}-${c.title}-${i}`} className="p-3 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-vgold/20 flex items-center justify-center text-[11px] font-bold text-vgold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-[13px] text-white truncate">{c.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-bold text-white/70">{c.type}</span>
                      <span className="text-[12px] text-vgold font-bold tabular-nums w-20 text-right">
                        {c.views.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}

function Tile({
  icon: Icon, label, value, color,
}: { icon: typeof Users; label: string; value: string; color: string }) {
  return (
    <div className="p-3.5 rounded-xl glass">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}25` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-lg font-black text-white leading-tight">{value}</div>
      <div className="text-[10px] text-vmuted mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl glass">
      <h3 className="text-sm font-bold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

/** Vertical bars for time series. */
function BarRow({
  data, format, gradient = 'from-vred to-vgold',
}: { data: { label: string; value: number }[]; format: (v: number) => string; gradient?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
          <div className="w-full flex-1 flex items-end justify-center">
            <div
              className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t ${gradient}`}
              style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
              title={format(d.value)}
            />
          </div>
          <div className="text-[10px] text-vmuted">{d.label}</div>
          <div className="text-[9px] text-white/60 truncate w-full text-center">{format(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

/** Horizontal bars for ranked categories. */
function HBar({
  data, format,
}: { data: { label: string; value: number }[]; format: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-36 text-[11px] text-white/80 truncate flex-shrink-0">{d.label}</span>
          <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-vred to-vgold" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-20 text-right text-[10px] text-vmuted tabular-nums flex-shrink-0">{format(d.value)}</span>
        </div>
      ))}
    </div>
  );
}
