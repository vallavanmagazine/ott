import { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { fetchWallet, type WalletView } from '@/services/sponsor';

export function BillingScreen({ onBack }: { onBack: () => void }) {
  const [wallet, setWallet] = useState<WalletView>({ balanceRupees: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet().then((w) => { setWallet(w); setLoading(false); });
  }, []);

  const topUp = () => {
    alert('Wallet top-up via Razorpay arrives in Phase 5 (test mode). Balance and per-post deduction are wired to the wallet tables now.');
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Billing & Wallet" onBack={onBack} />

      <div className="px-4 mt-4">
        {/* Wallet balance */}
        <div className="p-5 rounded-card glass-strong mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-vred/20 flex items-center justify-center">
              <Wallet size={18} className="text-vred" />
            </div>
            <div>
              <div className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Wallet Balance</div>
              <div className="text-[10px] text-vmuted">Pay-per-published-post</div>
            </div>
          </div>
          <div className="text-3xl font-black text-vgold">
            {loading ? '…' : `₹${wallet.balanceRupees.toLocaleString('en-IN')}`}
          </div>
          <button
            onClick={topUp}
            className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2 shadow-glow"
          >
            <Plus size={16} /> Top Up Wallet
          </button>
        </div>

        {/* Transactions */}
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
                  <div className={`text-sm font-bold ${credit ? 'text-green-400' : 'text-white'}`}>
                    {credit ? '+' : ''}₹{Math.abs(t.amountRupees).toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
