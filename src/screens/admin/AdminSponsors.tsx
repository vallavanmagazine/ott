/**
 * Sponsors — the advertiser roster and a 360° detail view per sponsor:
 * profile, campaigns, wallet ledger, invoices and Razorpay payment links.
 *
 * Payment links: when the NestJS payments backend is configured we ask it to
 * mint a Razorpay link (it holds the secret key). When it is not, the admin can
 * record a link they created in the Razorpay dashboard so the ledger stays
 * complete — this client never touches a Razorpay secret either way.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2, Ban, CheckCircle2, Eye, Pencil, Plus, Wallet, Link2, Copy,
  Download, IndianRupee, MessageCircle, Mail,
} from 'lucide-react';
import {
  fetchSponsors, fetchSponsorDetail,
  type AdminSponsorRow, type SponsorDetail,
} from '@/services/admin-sponsors';
import { setSponsorStatus, createSponsor, updateSponsor } from '@/services/admin-writes';
import { createPaymentLink, shareLinks } from '@/services/payments';
import { recordManualPaymentLink } from '@/services/admin-payments';
import { hasBackend } from '@/lib/api';
import { tamilNaduDistricts } from '@/data/mockData';
import { useToast } from '@/components/admin/Toast';
import { rupees, rupeesCompactINR } from '@/lib/admin-options';
import {
  AdminModal, SaveBar, Field, TextInput, SelectInput, SearchInput, StatusPill,
  StatCard, SkeletonTable, EmptyState, IconButton, Tabs, useBusy,
} from '@/components/admin/ui';

interface SponsorForm {
  name: string;
  email: string;
  phone: string;
  ownerName: string;
  businessType: string;
  gstNumber: string;
  district: string;
  status: string;
}

const BLANK_SPONSOR: SponsorForm = {
  name: '', email: '', phone: '', ownerName: '', businessType: '',
  gstNumber: '', district: '', status: 'Active',
};

export function AdminSponsors() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [sponsors, setSponsors] = useState<AdminSponsorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Pending' | 'Suspended'>('All');

  const [viewing, setViewing] = useState<AdminSponsorRow | null>(null);
  const [editing, setEditing] = useState<AdminSponsorRow | 'new' | null>(null);
  const [linkFor, setLinkFor] = useState<AdminSponsorRow | null>(null);

  const load = useCallback(async () => {
    setSponsors(await fetchSponsors());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sponsors.filter((s) => {
      const matchesQuery = !q
        || s.name.toLowerCase().includes(q)
        || s.email.toLowerCase().includes(q)
        || s.phone.includes(q);
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [sponsors, query, statusFilter]);

  const toggleStatus = (s: AdminSponsorRow) => withBusy(s.id, async () => {
    const next = s.status === 'Suspended' ? 'Active' : 'Suspended';
    try {
      await setSponsorStatus(s.id, next, s.name);
      toast.success(`${s.name} → ${next}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const save = async (form: SponsorForm) => {
    if (editing === 'new') {
      await createSponsor(form);
      toast.success(`Sponsor "${form.name}" created`);
    } else if (editing) {
      await updateSponsor(editing.id, form);
      toast.success(`"${form.name}" updated`);
    }
    setEditing(null);
    await load();
  };

  const totalSpend = sponsors.reduce((sum, s) => sum + s.spend, 0);
  const totalWallet = sponsors.reduce((sum, s) => sum + s.walletBalance, 0);
  const active = sponsors.filter((s) => s.status === 'Active').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Sponsors" value={sponsors.length} icon={<Building2 size={13} />} />
        <StatCard label="Active" value={active} accent="text-green-400" />
        <StatCard label="Total Spend" value={rupeesCompactINR(totalSpend)} accent="text-vgold" />
        <StatCard label="Wallet Balances" value={rupeesCompactINR(totalWallet)} accent="text-blue-400" />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name, email or phone..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
        >
          {['All', 'Active', 'Pending', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={() => setEditing('new')}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={16} /> Add Sponsor
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState title={sponsors.length === 0 ? 'No sponsors yet' : 'Nothing matches those filters'} />
      ) : (
        <div className="rounded-xl glass overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-bold">Wallet</th>
                <th className="text-left px-4 py-3 font-bold">Campaigns</th>
                <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Spend</th>
                <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-bold">Status</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{s.name}</div>
                    {s.district && <div className="text-[10px] text-vmuted">{s.district}</div>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-[11px] text-vmuted">{s.email || '—'}</div>
                    <div className="text-[11px] text-vmuted">{s.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-blue-400 font-bold tabular-nums">{rupees(s.walletBalance)}</td>
                  <td className="px-4 py-3 text-vmuted tabular-nums">
                    {s.campaignCount}
                    {s.activeCampaigns > 0 && <span className="text-green-400 text-[10px] ml-1">({s.activeCampaigns} active)</span>}
                  </td>
                  <td className="px-4 py-3 text-vgold font-bold hidden lg:table-cell tabular-nums">{rupees(s.spend)}</td>
                  <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{s.joined}</td>
                  <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton onClick={() => setViewing(s)} title="View details"><Eye size={14} /></IconButton>
                      <IconButton onClick={() => setEditing(s)} title="Edit profile"><Pencil size={14} /></IconButton>
                      <IconButton onClick={() => setLinkFor(s)} title="Generate payment link"><Link2 size={14} /></IconButton>
                      <button
                        onClick={() => toggleStatus(s)}
                        disabled={isBusy(s.id)}
                        title={s.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50 ${
                          s.status === 'Suspended' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {s.status === 'Suspended' ? <><CheckCircle2 size={11} /> Activate</> : <><Ban size={11} /> Suspend</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <SponsorDetailModal sponsor={viewing} onClose={() => setViewing(null)} onPaymentLink={() => { setLinkFor(viewing); setViewing(null); }} />}

      {editing && (
        <SponsorFormModal
          initial={editing === 'new' ? BLANK_SPONSOR : {
            name: editing.name, email: editing.email, phone: editing.phone,
            ownerName: editing.ownerName, businessType: editing.businessType,
            gstNumber: editing.gstNumber, district: editing.district, status: editing.status,
          }}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {linkFor && <PaymentLinkModal sponsor={linkFor} onClose={() => setLinkFor(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view
// ---------------------------------------------------------------------------
type DetailTab = 'campaigns' | 'wallet' | 'invoices' | 'links';

function SponsorDetailModal({
  sponsor, onClose, onPaymentLink,
}: { sponsor: AdminSponsorRow; onClose: () => void; onPaymentLink: () => void }) {
  const [tab, setTab] = useState<DetailTab>('campaigns');
  const [detail, setDetail] = useState<SponsorDetail | null>(null);

  useEffect(() => {
    fetchSponsorDetail(sponsor.id).then(setDetail).catch(() => setDetail(null));
  }, [sponsor.id]);

  return (
    <AdminModal title={sponsor.name} subtitle={sponsor.email || sponsor.phone || 'Sponsor account'} onClose={onClose} wide>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Wallet" value={rupees(detail?.walletBalance ?? sponsor.walletBalance)} accent="text-blue-400" icon={<Wallet size={13} />} />
        <StatCard label="Campaigns" value={sponsor.campaignCount} />
        <StatCard label="Lifetime Spend" value={rupees(sponsor.spend)} accent="text-vgold" />
        <StatCard label="Status" value={sponsor.status} accent={sponsor.status === 'Active' ? 'text-green-400' : 'text-red-400'} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3.5 rounded-xl glass text-[12px]">
        <DetailLine label="Owner" value={sponsor.ownerName} />
        <DetailLine label="Business type" value={sponsor.businessType} />
        <DetailLine label="GST" value={sponsor.gstNumber} />
        <DetailLine label="District" value={sponsor.district} />
        <DetailLine label="Email" value={sponsor.email} />
        <DetailLine label="Phone" value={sponsor.phone} />
        <DetailLine label="Joined" value={sponsor.joined} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Tabs<DetailTab>
          tabs={[
            { key: 'campaigns', label: 'Campaigns', count: detail?.campaigns.length },
            { key: 'wallet', label: 'Wallet', count: detail?.transactions.length },
            { key: 'invoices', label: 'Invoices', count: detail?.invoices.length },
            { key: 'links', label: 'Payment Links', count: detail?.paymentLinks.length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <button
          onClick={onPaymentLink}
          className="px-3 py-2 rounded-full bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95"
        >
          <IndianRupee size={13} /> Payment Link
        </button>
      </div>

      {!detail ? (
        <SkeletonTable rows={4} cols={4} />
      ) : tab === 'campaigns' ? (
        detail.campaigns.length === 0 ? <EmptyState title="No campaigns yet" /> : (
          <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
            {detail.campaigns.map((c) => (
              <div key={c.id} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-vmuted">
                    {c.impressions.toLocaleString('en-IN')} impressions · {c.clicks.toLocaleString('en-IN')} clicks ·{' '}
                    {c.districts.length === 0 ? 'All Tamil Nadu' : `${c.districts.length} districts`} · from {c.startDate}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] font-bold text-vgold tabular-nums">{rupees(c.spend)}</div>
                  <div className="text-[10px] text-vmuted tabular-nums">of {rupees(c.budget)}</div>
                </div>
                <StatusPill status={c.status} />
              </div>
            ))}
          </div>
        )
      ) : tab === 'wallet' ? (
        detail.transactions.length === 0 ? <EmptyState title="No wallet activity" /> : (
          <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
            {detail.transactions.map((t) => (
              <div key={t.id} className="p-3 flex items-center gap-3">
                <StatusPill status={t.kind} tone={t.amountRupees >= 0 ? 'green' : 'grey'} />
                <span className="flex-1 text-[11px] text-vmuted truncate">{t.reference || '—'}</span>
                <span className="text-[10px] text-vmuted">{t.date}</span>
                <span className={`text-[12px] font-bold tabular-nums w-24 text-right ${t.amountRupees >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {t.amountRupees >= 0 ? '+' : '−'}{rupees(Math.abs(t.amountRupees))}
                </span>
              </div>
            ))}
          </div>
        )
      ) : tab === 'invoices' ? (
        detail.invoices.length === 0 ? <EmptyState title="No invoices yet" /> : (
          <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
            {detail.invoices.map((i) => (
              <div key={i.id} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-white">{i.invoiceNumber}</div>
                  <div className="text-[10px] text-vmuted">{i.type} · {i.date} · GST {rupees(i.gstRupees)}</div>
                </div>
                <span className="text-[12px] font-bold text-vgold tabular-nums">{rupees(i.totalRupees)}</span>
                {i.pdfUrl ? (
                  <a href={i.pdfUrl} target="_blank" rel="noreferrer" className="text-vred" title="Download invoice PDF">
                    <Download size={15} />
                  </a>
                ) : (
                  <span className="text-[9px] text-vmuted w-[15px] text-center" title="No PDF generated yet">—</span>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        detail.paymentLinks.length === 0 ? <EmptyState title="No payment links yet" /> : (
          <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
            {detail.paymentLinks.map((l) => (
              <div key={l.id} className="p-3 flex items-center gap-3">
                <StatusPill status={l.status} />
                <span className="flex-1 text-[11px] text-vmuted truncate">{l.shortUrl || 'no URL recorded'}</span>
                <span className="text-[10px] text-vmuted">{l.date}</span>
                <span className="text-[12px] font-bold text-vgold tabular-nums">{rupees(l.amountRupees)}</span>
                {l.shortUrl && <CopyButton value={l.shortUrl} />}
              </div>
            ))}
          </div>
        )
      )}
    </AdminModal>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-vmuted font-bold flex-shrink-0">{label}</span>
      <span className="text-white/85 truncate">{value || '—'}</span>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const toast = useToast();
  return (
    <IconButton
      title="Copy link"
      onClick={() => {
        navigator.clipboard.writeText(value)
          .then(() => toast.success('Link copied'))
          .catch(() => toast.error('Could not copy — select the URL manually'));
      }}
    >
      <Copy size={13} />
    </IconButton>
  );
}

// ---------------------------------------------------------------------------
// Sponsor profile form
// ---------------------------------------------------------------------------
function SponsorFormModal({
  initial, isNew, onClose, onSave,
}: { initial: SponsorForm; isNew: boolean; onClose: () => void; onSave: (f: SponsorForm) => Promise<void> }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof SponsorForm>(k: K, v: SponsorForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Sponsor name is required'); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={isNew ? 'Add Sponsor' : 'Edit Sponsor'}
      subtitle={isNew ? undefined : form.name}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} />}
    >
      <Field label="Business name" required>
        <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Tamil Tea Co." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Email">
          <TextInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="ads@example.in" />
        </Field>
        <Field label="Phone">
          <TextInput value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91…" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Owner name">
          <TextInput value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
        </Field>
        <Field label="Business type">
          <TextInput value={form.businessType} onChange={(e) => set('businessType', e.target.value)} placeholder="Retail / FMCG / Services" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GST number">
          <TextInput value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} placeholder="33ABCDE1234F1Z5" />
        </Field>
        <Field label="District">
          <SelectInput value={form.district} onChange={(e) => set('district', e.target.value)}>
            <option value="">Not set</option>
            {tamilNaduDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
          </SelectInput>
        </Field>
      </div>
      <Field label="Status">
        <SelectInput value={form.status} onChange={(e) => set('status', e.target.value)}>
          {['Active', 'Pending', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectInput>
      </Field>
    </AdminModal>
  );
}

// ---------------------------------------------------------------------------
// Payment link generator
// ---------------------------------------------------------------------------
function PaymentLinkModal({ sponsor, onClose }: { sponsor: AdminSponsorRow; onClose: () => void }) {
  const toast = useToast();
  const backendReady = hasBackend();
  const [amount, setAmount] = useState(4999);
  const [manualUrl, setManualUrl] = useState('');
  const [generated, setGenerated] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (amount <= 0) { toast.error('Enter an amount above zero'); return; }
    setSaving(true);
    try {
      if (backendReady) {
        const link = await createPaymentLink({
          sponsorId: sponsor.id,
          amountRupees: amount,
          name: sponsor.name,
          email: sponsor.email || undefined,
          contact: sponsor.phone || undefined,
        });
        setGenerated(link.shortUrl);
        toast.success('Payment link generated');
      } else {
        if (!manualUrl.trim()) {
          toast.error('Paste the Razorpay link URL to record it, or configure VITE_API_BASE_URL to generate one.');
          return;
        }
        await recordManualPaymentLink({ sponsorId: sponsor.id, amountRupees: amount, shortUrl: manualUrl.trim() });
        setGenerated(manualUrl.trim());
        toast.success('Payment link recorded');
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const share = generated ? shareLinks(generated, amount) : null;

  return (
    <AdminModal
      title="Payment Link"
      subtitle={sponsor.name}
      onClose={onClose}
      footer={
        generated
          ? <button onClick={onClose} className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95">Done</button>
          : <SaveBar onCancel={onClose} onSave={generate} saving={saving} label={backendReady ? 'Generate Link' : 'Record Link'} />
      }
    >
      <Field label="Amount (₹)" required hint="Wallet top-up amount the sponsor will pay.">
        <TextInput type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </Field>

      <div className="flex gap-2 flex-wrap">
        {[999, 2999, 4999, 9999, 25000].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${amount === v ? 'bg-vred text-white' : 'glass text-vmuted'}`}
          >
            {rupees(v)}
          </button>
        ))}
      </div>

      {!backendReady && !generated && (
        <>
          <div className="p-3 rounded-xl bg-vgold/10 border border-vgold/25">
            <p className="text-[11px] text-white/85 leading-relaxed">
              The payments backend is not configured (<span className="font-mono">VITE_API_BASE_URL</span>), so this
              panel cannot mint a Razorpay link. Create the link in the Razorpay dashboard and paste it below to record
              it against this sponsor.
            </p>
          </div>
          <Field label="Razorpay link URL">
            <TextInput value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} placeholder="https://rzp.io/i/..." />
          </Field>
        </>
      )}

      {generated && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl glass flex items-center gap-2">
            <Link2 size={15} className="text-vgold flex-shrink-0" />
            <span className="flex-1 text-xs text-white truncate font-mono">{generated}</span>
            <CopyButton value={generated} />
          </div>
          {share && (
            <div className="grid grid-cols-3 gap-2">
              <a href={share.whatsapp} target="_blank" rel="noreferrer" className="py-2.5 rounded-xl glass text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
                <MessageCircle size={13} /> WhatsApp
              </a>
              <a href={share.sms} className="py-2.5 rounded-xl glass text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
                <MessageCircle size={13} /> SMS
              </a>
              <a href={share.email} className="py-2.5 rounded-xl glass text-white text-[11px] font-bold flex items-center justify-center gap-1.5">
                <Mail size={13} /> Email
              </a>
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
}
