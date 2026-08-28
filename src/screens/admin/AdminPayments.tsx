/**
 * Payments — every rupee that moves through the platform, in three views:
 * the wallet ledger, invoices, and Razorpay payment links.
 *
 * Revenue is counted from positive wallet credits (top-ups). Negative rows are
 * campaign spend deducted from a wallet and are shown, but never added to
 * revenue — that would double-count money already banked at top-up.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, IndianRupee, ReceiptText, Link2, Copy, Mail, Plus } from 'lucide-react';
import {
  fetchAllPayments, fetchAllInvoices, fetchAllPaymentLinks, revenueTotals,
  createInvoice, markInvoiceEmailed, setPaymentLinkStatus, GST_RATE,
  type PaymentRow, type InvoiceRow, type PaymentLinkRow,
} from '@/services/admin-payments';
import { fetchSponsorOptions } from '@/services/admin-campaigns';
import { useToast } from '@/components/admin/Toast';
import { rupees, rupeesCompactINR } from '@/lib/admin-options';
import { downloadCsv, datedFilename } from '@/lib/csv';
import {
  AdminModal, SaveBar, Field, TextInput, SelectInput, SearchInput, StatusPill,
  StatCard, SkeletonTable, EmptyState, IconButton, Tabs, useBusy,
} from '@/components/admin/ui';

type Tab = 'payments' | 'invoices' | 'links';

export function AdminPayments() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [tab, setTab] = useState<Tab>('payments');
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [links, setLinks] = useState<PaymentLinkRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [sponsors, setSponsors] = useState<{ id: string; name: string }[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const load = useCallback(async () => {
    const [p, i, l] = await Promise.all([fetchAllPayments(), fetchAllInvoices(), fetchAllPaymentLinks()]);
    setPayments(p); setInvoices(i); setLinks(l);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetchSponsorOptions().then(setSponsors).catch(() => {});
  }, [load]);

  const inRange = useCallback((iso: string) => {
    if (fromDate && iso < fromDate) return false;
    if (toDate && iso > toDate) return false;
    return true;
  }, [fromDate, toDate]);

  const filteredPayments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) =>
      (!q || p.sponsorName.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q))
      && (kindFilter === 'All' || p.kind === kindFilter)
      && inRange(p.isoDate));
  }, [payments, query, kindFilter, inRange]);

  const filteredInvoices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((i) =>
      (!q || i.sponsorName.toLowerCase().includes(q) || i.invoiceNumber.toLowerCase().includes(q))
      && inRange(i.isoDate));
  }, [invoices, query, inRange]);

  const filteredLinks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return links.filter((l) => !q || l.sponsorName.toLowerCase().includes(q) || l.shortUrl.toLowerCase().includes(q));
  }, [links, query]);

  const totals = useMemo(() => revenueTotals(filteredPayments), [filteredPayments]);
  const kinds = useMemo(() => ['All', ...new Set(payments.map((p) => p.kind))], [payments]);

  const exportCurrent = () => {
    if (tab === 'payments') {
      downloadCsv(
        datedFilename('vallavan-payments'),
        ['Date', 'Sponsor', 'Type', 'Reference', 'Amount (₹)'],
        filteredPayments.map((p) => [p.date, p.sponsorName, p.kind, p.reference, p.amountRupees]),
      );
    } else if (tab === 'invoices') {
      downloadCsv(
        datedFilename('vallavan-invoices'),
        ['Date', 'Invoice #', 'Sponsor', 'Type', 'Amount (₹)', 'GST (₹)', 'Total (₹)', 'Emailed'],
        filteredInvoices.map((i) => [i.date, i.invoiceNumber, i.sponsorName, i.type, i.amountRupees, i.gstRupees, i.totalRupees, i.sentViaEmail ? 'yes' : 'no']),
      );
    } else {
      downloadCsv(
        datedFilename('vallavan-payment-links'),
        ['Date', 'Sponsor', 'Amount (₹)', 'Status', 'Purpose', 'URL'],
        filteredLinks.map((l) => [l.date, l.sponsorName, l.amountRupees, l.status, l.purpose, l.shortUrl]),
      );
    }
    toast.success('Exported to CSV');
  };

  const markPaid = (l: PaymentLinkRow) => withBusy(l.id, async () => {
    try {
      await setPaymentLinkStatus(l.id, 'paid');
      toast.success('Link marked paid');
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const resend = (i: InvoiceRow) => withBusy(i.id, async () => {
    try {
      await markInvoiceEmailed(i.id, i.invoiceNumber);
      toast.success(`${i.invoiceNumber} marked for delivery to ${i.sponsorName}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Revenue" value={rupeesCompactINR(totals.totalRupees)} accent="text-vgold" icon={<IndianRupee size={13} />} />
        <StatCard label="This Month" value={rupeesCompactINR(totals.thisMonthRupees)} accent="text-green-400" />
        <StatCard label="This Week" value={rupeesCompactINR(totals.thisWeekRupees)} accent="text-blue-400" />
        <StatCard label="Refunds" value={rupeesCompactINR(totals.refundsRupees)} accent="text-red-400" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Tabs<Tab>
          tabs={[
            { key: 'payments', label: 'All Payments', count: payments.length },
            { key: 'invoices', label: 'Invoices', count: invoices.length },
            { key: 'links', label: 'Payment Links', count: links.length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="flex-1" />
        {tab === 'invoices' && (
          <button onClick={() => setCreatingInvoice(true)} className="px-3 py-2 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
            <Plus size={14} /> New Invoice
          </button>
        )}
        <button onClick={exportCurrent} className="px-3 py-2 rounded-lg glass text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search sponsor, reference or invoice #..." />
        {tab === 'payments' && (
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
            {kinds.map((k) => <option key={k} value={k}>{k === 'All' ? 'All Types' : k}</option>)}
          </select>
        )}
        {tab !== 'links' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass">
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-transparent text-xs text-white outline-none" />
            <span className="text-vmuted text-xs">to</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-transparent text-xs text-white outline-none" />
          </div>
        )}
      </div>

      {loading ? <SkeletonTable rows={6} cols={5} /> : tab === 'payments' ? (
        filteredPayments.length === 0 ? <EmptyState title="No wallet transactions" hint="Top-ups and campaign deductions appear here." /> : (
          <div className="rounded-xl glass overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                  <th className="text-left px-4 py-3 font-bold">Date</th>
                  <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                  <th className="text-left px-4 py-3 font-bold">Type</th>
                  <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Reference</th>
                  <th className="text-right px-4 py-3 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 text-vmuted">{p.date}</td>
                    <td className="px-4 py-3 font-semibold text-white">{p.sponsorName}</td>
                    <td className="px-4 py-3"><StatusPill status={p.kind} tone={p.amountRupees >= 0 ? 'green' : 'grey'} /></td>
                    <td className="px-4 py-3 text-vmuted hidden md:table-cell text-[11px] max-w-[220px] truncate">{p.reference || '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${p.amountRupees >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {p.amountRupees >= 0 ? '+' : '−'}{rupees(Math.abs(p.amountRupees))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : tab === 'invoices' ? (
        filteredInvoices.length === 0 ? <EmptyState title="No invoices" hint="Create one from a sponsor's wallet top-up." /> : (
          <div className="rounded-xl glass overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                  <th className="text-left px-4 py-3 font-bold">Invoice #</th>
                  <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                  <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-bold">Amount</th>
                  <th className="text-left px-4 py-3 font-bold hidden md:table-cell">GST</th>
                  <th className="text-left px-4 py-3 font-bold">Total</th>
                  <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvoices.map((i) => (
                  <tr key={i.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-semibold text-white">{i.invoiceNumber}</td>
                    <td className="px-4 py-3 text-vmuted">{i.sponsorName}</td>
                    <td className="px-4 py-3 text-vmuted hidden md:table-cell text-[11px]">{i.type}</td>
                    <td className="px-4 py-3 text-vmuted tabular-nums">{rupees(i.amountRupees)}</td>
                    <td className="px-4 py-3 text-vmuted hidden md:table-cell tabular-nums">{rupees(i.gstRupees)}</td>
                    <td className="px-4 py-3 text-vgold font-bold tabular-nums">{rupees(i.totalRupees)}</td>
                    <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{i.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {i.pdfUrl ? (
                          <a href={i.pdfUrl} target="_blank" rel="noreferrer" title="Download PDF" className="w-7 h-7 flex items-center justify-center rounded-lg text-vmuted hover:bg-white/10 hover:text-white">
                            <Download size={14} />
                          </a>
                        ) : (
                          <span className="text-[9px] text-vmuted px-1" title="No PDF generated yet">no PDF</span>
                        )}
                        <IconButton
                          onClick={() => resend(i)}
                          title={i.sentViaEmail ? 'Already marked emailed — mark again' : 'Mark for email delivery'}
                          disabled={isBusy(i.id)}
                        >
                          <Mail size={14} className={i.sentViaEmail ? 'text-green-400' : ''} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        filteredLinks.length === 0 ? <EmptyState title="No payment links" hint="Generate one from a sponsor's row on the Sponsors screen." /> : (
          <div className="rounded-xl glass overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                  <th className="text-left px-4 py-3 font-bold">Sponsor</th>
                  <th className="text-left px-4 py-3 font-bold">Amount</th>
                  <th className="text-left px-4 py-3 font-bold">Status</th>
                  <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Purpose</th>
                  <th className="text-left px-4 py-3 font-bold">URL</th>
                  <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Created</th>
                  <th className="text-right px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLinks.map((l) => (
                  <tr key={l.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-semibold text-white">{l.sponsorName}</td>
                    <td className="px-4 py-3 text-vgold font-bold tabular-nums">{rupees(l.amountRupees)}</td>
                    <td className="px-4 py-3"><StatusPill status={l.status} /></td>
                    <td className="px-4 py-3 text-vmuted hidden md:table-cell text-[11px]">{l.purpose}</td>
                    <td className="px-4 py-3 text-vmuted text-[11px] max-w-[200px] truncate font-mono">{l.shortUrl || '—'}</td>
                    <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{l.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {l.shortUrl && (
                          <IconButton
                            title="Copy link"
                            onClick={() => {
                              navigator.clipboard.writeText(l.shortUrl)
                                .then(() => toast.success('Link copied'))
                                .catch(() => toast.error('Could not copy'));
                            }}
                          >
                            <Copy size={13} />
                          </IconButton>
                        )}
                        {l.status !== 'paid' && (
                          <button
                            onClick={() => markPaid(l)}
                            disabled={isBusy(l.id)}
                            className="px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-[10px] font-bold disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <p className="text-[11px] text-vmuted flex items-center gap-1.5">
        <ReceiptText size={12} />
        {tab === 'payments' ? `${filteredPayments.length} transactions`
          : tab === 'invoices' ? `${filteredInvoices.length} invoices`
            : `${filteredLinks.length} links`}
      </p>

      {creatingInvoice && (
        <InvoiceFormModal
          sponsors={sponsors}
          onClose={() => setCreatingInvoice(false)}
          onSaved={async () => { setCreatingInvoice(false); await load(); }}
        />
      )}
    </div>
  );
}

function InvoiceFormModal({
  sponsors, onClose, onSaved,
}: { sponsors: { id: string; name: string }[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [sponsorId, setSponsorId] = useState('');
  const [amount, setAmount] = useState(4999);
  const [type, setType] = useState('wallet_topup');
  const [saving, setSaving] = useState(false);

  const gst = Math.round(amount * GST_RATE);

  const submit = async () => {
    if (!sponsorId) { toast.error('Select a sponsor'); return; }
    if (amount <= 0) { toast.error('Amount must be above zero'); return; }
    setSaving(true);
    try {
      const number = await createInvoice({ sponsorId, amountRupees: amount, type });
      toast.success(`Invoice ${number} created`);
      await onSaved();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title="New Invoice"
      subtitle={`GST at ${(GST_RATE * 100).toFixed(0)}%`}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label="Create Invoice" />}
    >
      <Field label="Sponsor" required>
        <SelectInput value={sponsorId} onChange={(e) => setSponsorId(e.target.value)}>
          <option value="">Select sponsor…</option>
          {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </SelectInput>
      </Field>
      <Field label="Type">
        <SelectInput value={type} onChange={(e) => setType(e.target.value)}>
          <option value="wallet_topup">Wallet top-up</option>
          <option value="inspire_package">Inspire package</option>
          <option value="magazine">Magazine</option>
          <option value="other">Other</option>
        </SelectInput>
      </Field>
      <Field label="Amount before GST (₹)" required>
        <TextInput type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      </Field>
      <div className="p-3 rounded-xl glass space-y-1 text-[12px]">
        <div className="flex justify-between"><span className="text-vmuted">Subtotal</span><span className="text-white tabular-nums">{rupees(amount)}</span></div>
        <div className="flex justify-between"><span className="text-vmuted">GST ({(GST_RATE * 100).toFixed(0)}%)</span><span className="text-white tabular-nums">{rupees(gst)}</span></div>
        <div className="flex justify-between pt-1 border-t border-white/8">
          <span className="text-white font-bold">Total</span>
          <span className="text-vgold font-bold tabular-nums">{rupees(amount + gst)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-vmuted">
        <Link2 size={11} /> PDF generation and email delivery run server-side once the backend is configured.
      </div>
    </AdminModal>
  );
}
