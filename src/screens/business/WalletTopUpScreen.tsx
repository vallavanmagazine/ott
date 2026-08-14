import { useState, useEffect } from 'react';
import { Wallet, Gift, Copy, Check, MessageCircle, Mail } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { getCurrentSponsorId } from '@/services/sponsor';
import { createPaymentLink, fetchPaymentLinks, shareLinks, type PaymentLink } from '@/services/payments';
import { walletBonusRupees, MIN_TOPUP_RUPEES, TOPUP_PRESETS } from '@/services/pricing';

const BONUS_TIERS = [
  { min: 5000, pct: 10 },
  { min: 10000, pct: 20 },
  { min: 25000, pct: 30 },
];

export function WalletTopUpScreen({ onBack }: { onBack: () => void }) {
  const [sponsorId, setSponsorId] = useState<string | null>(null);
  const [amount, setAmount] = useState(4999);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<{ url: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<PaymentLink[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentSponsorId().then((id) => {
      setSponsorId(id);
      if (id) fetchPaymentLinks(id).then(setHistory);
    });
  }, []);

  const bonus = walletBonusRupees(amount);
  const credited = amount + bonus;

  const generate = async () => {
    setError(null);
    if (amount < MIN_TOPUP_RUPEES) { setError(`Minimum top-up is ₹${MIN_TOPUP_RUPEES}.`); return; }
    if (!sponsorId) { setError('No sponsor profile linked. Complete sponsor signup first.'); return; }
    setBusy(true);
    try {
      const res = await createPaymentLink({ sponsorId, amountRupees: amount, purpose: 'wallet_topup' });
      setLink({ url: res.shortUrl, amount });
      fetchPaymentLinks(sponsorId).then(setHistory);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = () => { if (link) { navigator.clipboard.writeText(link.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } };
  const share = link ? shareLinks(link.url, link.amount) : null;

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Top Up Wallet" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        {/* Amount */}
        <div className="p-5 rounded-card glass-strong">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-vred/20 flex items-center justify-center"><Wallet size={18} className="text-vred" /></div>
            <div className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Choose Amount</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {TOPUP_PRESETS.map((p) => (
              <button key={p} onClick={() => setAmount(p)} className={`py-3 rounded-xl text-sm font-bold transition active:scale-95 ${amount === p ? 'bg-vred text-white' : 'glass text-vmuted'}`}>₹{p.toLocaleString('en-IN')}</button>
            ))}
          </div>
          <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Custom amount (₹)</label>
          <input type="number" min={MIN_TOPUP_RUPEES} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />

          {/* Bonus callout */}
          <div className="mt-3 p-3 rounded-xl bg-vgold/10 border border-vgold/30">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-vgold" />
              <span className="text-xs font-bold text-vgold">
                {bonus > 0 ? `+₹${bonus.toLocaleString('en-IN')} bonus` : `Add ₹${(5000 - amount).toLocaleString('en-IN')} more for a 10% bonus`}
              </span>
            </div>
            <div className="text-[11px] text-white/80 mt-1">You'll be credited <span className="font-black text-white">₹{credited.toLocaleString('en-IN')}</span> after payment.</div>
          </div>

          {/* Tier ladder */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {BONUS_TIERS.map((t) => (
              <div key={t.min} className={`p-2 rounded-lg text-center ${amount >= t.min ? 'bg-vgold/20' : 'glass'}`}>
                <div className={`text-sm font-black ${amount >= t.min ? 'text-vgold' : 'text-white'}`}>{t.pct}%</div>
                <div className="text-[9px] text-vmuted">₹{(t.min / 1000)}K+</div>
              </div>
            ))}
          </div>

          {error && <p className="text-[11px] text-vred mt-3">{error}</p>}

          <button onClick={generate} disabled={busy} className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
            {busy ? 'Generating link…' : 'Generate Payment Link'}
          </button>
          <p className="text-[10px] text-vgold text-center mt-2">Razorpay payment link (test mode) — no card details entered in-app.</p>
        </div>

        {/* Generated link */}
        {link && (
          <div className="mt-4 p-4 rounded-card glass">
            <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold mb-2">Payment link ready</div>
            <div className="flex items-center gap-2">
              <input readOnly value={link.url} className="flex-1 px-3 py-2.5 rounded-lg glass text-xs text-white outline-none" />
              <button onClick={copy} className="w-10 h-10 flex items-center justify-center rounded-lg bg-vred text-white">{copied ? <Check size={16} /> : <Copy size={16} />}</button>
            </div>
            {share && (
              <div className="flex gap-2 mt-2">
                <a href={share.whatsapp} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold flex items-center justify-center gap-1.5"><MessageCircle size={14} /> WhatsApp</a>
                <a href={share.sms} className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold flex items-center justify-center gap-1.5"><MessageCircle size={14} /> SMS</a>
                <a href={share.email} className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold flex items-center justify-center gap-1.5"><Mail size={14} /> Email</a>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Payment Links</h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">₹{h.amountRupees.toLocaleString('en-IN')}</div>
                    <div className="text-[11px] text-vmuted">{h.purpose.replace(/_/g, ' ')} · {h.date}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${h.status === 'paid' ? 'bg-green-500/15 text-green-400' : 'bg-vgold/15 text-vgold'}`}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
