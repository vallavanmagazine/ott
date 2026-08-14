import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';

export function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (supabase) supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(100).then(({ data }) => setInvoices(data ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-white">Invoices</h3>
      <div className="rounded-xl glass overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
            <th className="text-left px-4 py-3 font-bold">Invoice #</th><th className="text-left px-4 py-3 font-bold">Type</th>
            <th className="text-left px-4 py-3 font-bold">Amount</th><th className="text-left px-4 py-3 font-bold">GST</th>
            <th className="text-left px-4 py-3 font-bold">Total</th><th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Date</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map((i) => (
              <tr key={i.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-semibold text-white">{i.invoice_number}</td>
                <td className="px-4 py-3 text-vmuted text-xs">{i.type}</td>
                <td className="px-4 py-3 text-vmuted">₹{(i.amount_paise / 100).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vmuted">₹{(i.gst_paise / 100).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vgold font-bold">₹{(i.total_paise / 100).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vmuted hidden sm:table-cell">{formatDate(i.created_at)}</td>
                <td className="px-4 py-3">{i.pdf_url ? <a href={i.pdf_url} className="text-vred"><Download size={15} /></a> : <span className="text-[10px] text-vmuted">no PDF</span>}</td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-vmuted text-sm">No invoices yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
