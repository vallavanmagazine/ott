import { useState } from 'react';
import { Send, Mail, Users, Megaphone } from 'lucide-react';
import { apiPost, hasBackend } from '@/lib/api';
import { logAudit } from '@/services/admin-writes';

type Audience = 'all' | 'sponsors' | 'freelancers';
type Category = 'newsletter' | 'promotional';

/**
 * Newsletter / promotional broadcast (FIX). Posts to the NestJS backend, which
 * pulls opted-in recipients from app_users and sends via Resend. Transactional
 * emails (welcome, invoice, receipts) are automatic elsewhere — this screen is
 * only for opt-in marketing blasts.
 */
export function AdminEmail() {
  const [audience, setAudience] = useState<Audience>('all');
  const [category, setCategory] = useState<Category>('newsletter');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ recipients: number; sent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backend = hasBackend();

  const send = async () => {
    setError(null); setResult(null);
    if (!subject.trim() || !html.trim()) { setError('Subject and body are required.'); return; }
    if (!backend) { setError('The backend (VITE_API_BASE_URL) must be running to send email.'); return; }
    if (!confirm(`Send this ${category} to "${audience}"? This emails real recipients.`)) return;
    setBusy(true);
    try {
      const res = await apiPost<{ ok: boolean; recipients: number; sent: number }>('/api/notify/broadcast', {
        audience, category, subject, html,
      });
      setResult({ recipients: res.recipients ?? 0, sent: res.sent ?? 0 });
      await logAudit(`Sent ${category} "${subject}" to ${audience} (${res.sent} emails)`);
      setSubject(''); setHtml('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {!backend && (
        <div className="p-3 rounded-xl bg-vgold/10 border border-vgold/25 text-[12px] text-white/90">
          Set <span className="font-mono">VITE_API_BASE_URL</span> and configure <span className="font-mono">RESEND_API_KEY</span> in Admin → API Settings to send email.
        </div>
      )}

      <div className="p-4 rounded-xl glass space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold flex items-center gap-1"><Users size={11} /> Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className="w-full mt-1 px-3 py-2.5 rounded-lg glass text-sm text-white outline-none">
              <option value="all" className="bg-vblack">All members</option>
              <option value="sponsors" className="bg-vblack">Sponsors only</option>
              <option value="freelancers" className="bg-vblack">Freelancers only</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold flex items-center gap-1"><Megaphone size={11} /> Type</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full mt-1 px-3 py-2.5 rounded-lg glass text-sm text-white outline-none">
              <option value="newsletter" className="bg-vblack">Newsletter</option>
              <option value="promotional" className="bg-vblack">Promotional</option>
            </select>
          </div>
        </div>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none" />
        <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Body (HTML allowed) — an unsubscribe footer is added automatically" rows={8} className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none resize-none font-mono" />
        {error && <p className="text-[11px] text-vred">{error}</p>}
        {result && <p className="text-[12px] text-green-400 flex items-center gap-1.5"><Mail size={13} /> Sent {result.sent} of {result.recipients} recipients.</p>}
        <button onClick={send} disabled={busy} className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Send size={14} /> {busy ? 'Sending…' : `Send ${category}`}
        </button>
        <p className="text-[10px] text-vmuted">Only recipients who haven't opted out receive marketing email. Transactional emails (welcome, invoices, receipts) send automatically and ignore opt-out.</p>
      </div>
    </div>
  );
}
