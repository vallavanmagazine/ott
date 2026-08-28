/**
 * Campaigns — pending approvals and the full campaign book.
 *
 * Approving a campaign sets it Active, which is what makes its creatives
 * eligible in the ad engine's geo cascade; rejecting ends it. Both write an
 * audit row and notify the sponsor through the notifications table.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, X, IndianRupee, MapPin, Eye, Pause, Play } from 'lucide-react';
import {
  fetchAllCampaigns, fetchCampaignAnalytics, ctr,
  type AdminCampaignRow, type CampaignAnalytics,
} from '@/services/admin-campaigns';
import { approveCampaign, rejectCampaign, setCampaignStatus } from '@/services/admin-writes';
import { notifySponsor } from '@/services/notifications';
import { useToast } from '@/components/admin/Toast';
import { rupees, rupeesCompactINR, CAMPAIGN_STATUSES, compactCount } from '@/lib/admin-options';
import {
  AdminModal, SearchInput, StatusPill, StatCard, SkeletonTable, EmptyState,
  IconButton, Tabs, useBusy,
} from '@/components/admin/ui';

type Tab = 'pending' | 'all';

export function AdminCampaignApprovals() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [tab, setTab] = useState<Tab>('pending');
  const [campaigns, setCampaigns] = useState<AdminCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewing, setViewing] = useState<AdminCampaignRow | null>(null);

  const load = useCallback(async () => {
    setCampaigns(await fetchAllCampaigns());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = useMemo(() => campaigns.filter((c) => c.status === 'Pending Approval'), [campaigns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.sponsorName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [campaigns, query, statusFilter]);

  const decide = (c: AdminCampaignRow, approved: boolean) => withBusy(c.id, async () => {
    try {
      if (approved) {
        await approveCampaign(c.id, c.name);
        await notifySponsor(
          'Campaign approved',
          `"${c.name}" is now live and serving to ${c.districts.length === 0 ? 'all Tamil Nadu' : `${c.districts.length} district(s)`}.`,
        );
        toast.success(`"${c.name}" approved and now Active`);
      } else {
        await rejectCampaign(c.id, c.name);
        await notifySponsor('Campaign rejected', `"${c.name}" was not approved. Please review and resubmit.`);
        toast.success(`"${c.name}" rejected`);
      }
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const togglePause = (c: AdminCampaignRow) => withBusy(c.id, async () => {
    const next = c.status === 'Paused' ? 'Active' : 'Paused';
    try {
      await setCampaignStatus(c.id, next, c.name);
      toast.success(`"${c.name}" → ${next}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const active = campaigns.filter((c) => c.status === 'Active');
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pending Approval" value={pending.length} accent={pending.length > 0 ? 'text-vgold' : 'text-white'} />
        <StatCard label="Active" value={active.length} accent="text-green-400" />
        <StatCard label="Total Impressions" value={compactCount(totalImpressions)} accent="text-blue-400" />
        <StatCard label="Total Spend" value={rupeesCompactINR(totalSpend)} accent="text-vgold" />
      </div>

      <Tabs<Tab>
        tabs={[
          { key: 'pending', label: 'Approvals', count: pending.length },
          { key: 'all', label: 'All Campaigns', count: campaigns.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <SkeletonTable rows={5} cols={5} /> : tab === 'pending' ? (
        pending.length === 0 ? (
          <EmptyState title="Nothing waiting for approval" hint="Sponsor submissions land here." />
        ) : (
          <div className="space-y-3">
            {pending.map((c) => (
              <div key={c.id} className="p-4 rounded-xl glass">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="text-[10px] text-vgold font-bold uppercase tracking-wider">{c.sponsorName}</div>
                    <h4 className="text-sm font-bold text-white mt-0.5">{c.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-vmuted flex-wrap">
                      <span className="flex items-center gap-1"><IndianRupee size={11} /> Budget: {rupees(c.budget)}</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {c.districts.length === 0 ? 'All Tamil Nadu' : `${c.districts.length} districts`}
                      </span>
                      <span>Submitted: {c.submitted}</span>
                      {c.dailyRateRupees > 0 && <span>{rupees(c.dailyRateRupees)}/day</span>}
                    </div>
                    {c.districts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.districts.slice(0, 8).map((d) => (
                          <span key={d} className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[9px] font-bold">{d}</span>
                        ))}
                        {c.districts.length > 8 && <span className="text-[9px] text-vmuted">+{c.districts.length - 8} more</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <IconButton onClick={() => setViewing(c)} title="View details"><Eye size={15} /></IconButton>
                    <button
                      onClick={() => decide(c, true)}
                      disabled={isBusy(c.id)}
                      className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1.5 hover:bg-green-500/30 active:scale-95 disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => decide(c, false)}
                      disabled={isBusy(c.id)}
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/30 active:scale-95 disabled:opacity-50"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search campaign or sponsor..." />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
            >
              <option value="All">All Status</option>
              {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? <EmptyState title="No campaigns match" /> : (
            <div className="rounded-xl glass overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                    <th className="text-left px-4 py-3 font-bold">Campaign</th>
                    <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                    <th className="text-left px-4 py-3 font-bold">Status</th>
                    <th className="text-left px-4 py-3 font-bold">Impressions</th>
                    <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Clicks</th>
                    <th className="text-left px-4 py-3 font-bold hidden md:table-cell">CTR</th>
                    <th className="text-left px-4 py-3 font-bold">Spend</th>
                    <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Districts</th>
                    <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Start</th>
                    <th className="text-right px-4 py-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-white/5 transition cursor-pointer" onClick={() => setViewing(c)}>
                      <td className="px-4 py-3 font-semibold text-white max-w-[200px] truncate">{c.name}</td>
                      <td className="px-4 py-3 text-vmuted">{c.sponsorName}</td>
                      <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3 text-white tabular-nums">{c.impressions.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-vmuted hidden md:table-cell tabular-nums">{c.clicks.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-blue-400 hidden md:table-cell tabular-nums">{ctr(c).toFixed(2)}%</td>
                      <td className="px-4 py-3 text-vgold font-bold tabular-nums">
                        {rupees(c.spend)}
                        <span className="text-[10px] text-vmuted"> / {rupees(c.budget)}</span>
                      </td>
                      <td className="px-4 py-3 text-vmuted hidden lg:table-cell">
                        {c.districts.length === 0 ? 'All TN' : c.districts.length}
                      </td>
                      <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{c.startDate}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <IconButton onClick={() => setViewing(c)} title="Details"><Eye size={14} /></IconButton>
                          {(c.status === 'Active' || c.status === 'Paused') && (
                            <button
                              onClick={() => togglePause(c)}
                              disabled={isBusy(c.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50 ${
                                c.status === 'Paused' ? 'bg-green-500/15 text-green-400' : 'bg-vgold/15 text-vgold'
                              }`}
                            >
                              {c.status === 'Paused' ? <><Play size={11} /> Resume</> : <><Pause size={11} /> Pause</>}
                            </button>
                          )}
                          {c.status === 'Pending Approval' && (
                            <button
                              onClick={() => decide(c, true)}
                              disabled={isBusy(c.id)}
                              className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-[10px] font-bold disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {viewing && <CampaignDetailModal campaign={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function CampaignDetailModal({ campaign, onClose }: { campaign: AdminCampaignRow; onClose: () => void }) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);

  useEffect(() => {
    fetchCampaignAnalytics(campaign.id).then(setAnalytics).catch(() => setAnalytics(null));
  }, [campaign.id]);

  const maxDistrict = Math.max(1, ...(analytics?.byDistrict ?? []).map((d) => d.impressions));
  const maxDay = Math.max(1, ...(analytics?.byDay ?? []).map((d) => d.impressions));
  const remaining = Math.max(0, campaign.budget - campaign.spend);

  return (
    <AdminModal title={campaign.name} subtitle={campaign.sponsorName} onClose={onClose} wide>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Impressions" value={campaign.impressions.toLocaleString('en-IN')} />
        <StatCard label="Clicks" value={campaign.clicks.toLocaleString('en-IN')} accent="text-green-400" />
        <StatCard label="CTR" value={`${ctr(campaign).toFixed(2)}%`} accent="text-blue-400" />
        <StatCard label="Remaining Budget" value={rupees(remaining)} accent="text-vgold" />
      </div>

      <div className="p-3.5 rounded-xl glass grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
        <div><span className="text-vmuted">Status:</span> <StatusPill status={campaign.status} /></div>
        <div><span className="text-vmuted">Start date:</span> <span className="text-white/85">{campaign.startDate}</span></div>
        <div><span className="text-vmuted">Budget:</span> <span className="text-white/85">{rupees(campaign.budget)}</span></div>
        <div><span className="text-vmuted">Spent:</span> <span className="text-white/85">{rupees(campaign.spend)}</span></div>
        <div><span className="text-vmuted">Daily rate:</span> <span className="text-white/85">{rupees(campaign.dailyRateRupees)}</span></div>
        <div><span className="text-vmuted">Submitted:</span> <span className="text-white/85">{campaign.submitted}</span></div>
      </div>

      {/* Budget burn-down */}
      <div>
        <div className="flex items-center justify-between text-[10px] text-vmuted mb-1">
          <span>Budget used</span>
          <span>{campaign.budget > 0 ? `${((campaign.spend / campaign.budget) * 100).toFixed(0)}%` : '—'}</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-vred to-vgold"
            style={{ width: `${campaign.budget > 0 ? Math.min(100, (campaign.spend / campaign.budget) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
          <MapPin size={14} className="text-vgold" /> Geo Targeting
        </h4>
        {campaign.districts.length === 0 ? (
          <p className="text-xs text-vmuted">Statewide — serves to every Tamil Nadu district.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {campaign.districts.map((d) => (
              <span key={d} className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 text-[10px] font-bold">{d}</span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-2">Impressions by District</h4>
        {analytics === null ? <SkeletonTable rows={3} cols={2} />
          : analytics.byDistrict.length === 0 ? <EmptyState title="No delivery recorded yet" />
            : (
              <div className="space-y-1.5">
                {analytics.byDistrict.map((d) => (
                  <div key={d.district} className="flex items-center gap-3">
                    <span className="w-32 text-[11px] text-white/80 truncate flex-shrink-0">{d.district}</span>
                    <div className="flex-1 h-4 rounded bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-vred to-vgold" style={{ width: `${(d.impressions / maxDistrict) * 100}%` }} />
                    </div>
                    <span className="w-24 text-right text-[10px] text-vmuted tabular-nums flex-shrink-0">
                      {d.impressions.toLocaleString('en-IN')} · {d.clicks}c
                    </span>
                  </div>
                ))}
              </div>
            )}
      </div>

      {analytics && analytics.byDay.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-white mb-2">Daily Impressions</h4>
          <div className="flex items-end gap-1 h-28">
            {analytics.byDay.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.day}: ${d.impressions}`}>
                <div className="w-full rounded-t bg-vgold" style={{ height: `${Math.max(3, (d.impressions / maxDay) * 100)}%` }} />
                <span className="text-[8px] text-vmuted truncate w-full text-center">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminModal>
  );
}
