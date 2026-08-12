import { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { fetchWallet, topUpWallet, type WalletView } from '@/services/sponsor';
import { loadRazorpayScript, RAZORPAY_KEY_ID } from '@/lib/razorpay';
import { useAuth } from '@/context/AuthContext';

const PRESETS = [500, 1000, 2000, 5000];

export function BillingScreen({ onBack }: { onBack: () => void }) {
  const auth = useAuth();
  const [wallet, setWallet] = useState<WalletView>({ balanceRupees: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchWallet().then((w) => { setWallet(w); setLoading(false); }); }, []);

  const startPayment = async () => {
    if (!RAZORPAY_KEY_ID) {
      alert('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID (test key) in .env.');
      return;
    }
    setProcessing(true);
    const ok = await loadRazorpayScript();
    if (!ok) { setProcessing(false); alert('Could not load Razorpay checkout. Check your connection.'); return; }

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'Vallavan Wallet',
      description: 'Wallet top-up (test mode)',
      prefill: { email: auth.email || undefined },
      theme: { color: '#D32F2F' },
      handler: async (resp: { razorpay_payment_id: string }) => {
        try {
          const updated = await topUpWallet(amount, resp.razorpay_payment_id);
          setWallet(updated);
          setShowTopUp(false);
        } catch (e) {
          alert(`Payment succeeded but wallet update failed: ${(e as Error).message}\nApply supabase/wallet_client_rls.sql.`);
        } finally {
          setProcessing(false);
        }
      },
      modal: { ondismiss: () => setProcessing(false) },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Billing & Wallet" onBack={onBack} />

      <div className="px-4 mt-4">
        <div className="p-5 rounded-card glass-strong mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-vred/20 flex items-center justify-center"><Wallet size={18} className="text-vred" /></div>
            <div>
              <div className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Wallet Balance</div>
              <div className="text-[10px] text-vmuted">Pay-per-published-post</div>
            </div>
          </div>
          <div className="text-3xl font-black text-vgold">{loading ? '…' : `₹${wallet.balanceRupees.toLocaleString('en-IN')}`}</div>
          <button onClick={() => setShowTopUp(true)} className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2 shadow-glow">
            <Plus size={16} /> Top Up Wallet
          </button>
        </div>

        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Transaction History</h3>
        {wallet.transactions.length === 0 ? (
          <div className="p-6 rounded-card glass text-center">
            <p className="text-sm text-white font-semibold">No transactions yet</p>
            <p className="text-xs text-vmuted mt-1">Top up your wallet to start running campaigns.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((t) => {
              const credit = t.amountRupees >= 0;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${credit ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                    {credit ? <ArrowDownLeft size={16} className="text-green-400" /> : <ArrowUpRight size={16} className="text-red-400" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white capitalize">{t.kind.replace(/_/g, ' ')}</div>
                    <div className="text-[11px] text-vmuted">{t.date}</div>
                  </div>
                  <div className={`text-sm font-bold ${credit ? 'text-green-400' : 'text-white'}`}>{credit ? '+' : ''}₹{Math.abs(t.amountRupees).toLocaleString('en-IN')}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showTopUp && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">Top Up Wallet</h3>
              <button onClick={() => setShowTopUp(false)} className="w-8 h-8 flex items-center justify-center rounded-full glass"><X size={16} className="text-white" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setAmount(p)} className={`py-3 rounded-xl text-sm font-bold transition active:scale-95 ${amount === p ? 'bg-vred text-white' : 'glass text-vmuted'}`}>₹{p.toLocaleString('en-IN')}</button>
              ))}
            </div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Custom amount (₹)</label>
            <input type="number" min={100} value={amount} onChange={(e) => setAmount(Math.max(100, Number(e.target.value)))} className="w-full mt-1 mb-3 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
            <button onClick={startPayment} disabled={processing} className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
              {processing ? 'Processing…' : `Pay ₹${amount.toLocaleString('en-IN')} (Test)`}
            </button>
            <p className="text-[10px] text-vgold text-center mt-2">Razorpay test mode — use test card 4111 1111 1111 1111</p>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
