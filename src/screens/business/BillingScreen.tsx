import { Download, CreditCard, Wallet } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';

export function BillingScreen({ onBack }: { onBack: () => void }) {
  const invoices = [
    { id: 'INV-2024-008', date: 'Aug 01, 2024', amount: '₹18,500', status: 'Paid' },
    { id: 'INV-2024-007', date: 'Jul 15, 2024', amount: '₹12,200', status: 'Paid' },
    { id: 'INV-2024-006', date: 'Jun 28, 2024', amount: '₹45,000', status: 'Paid' },
    { id: 'INV-2024-005', date: 'Jun 01, 2024', amount: '₹22,500', status: 'Paid' },
  ];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Billing & Invoices" onBack={onBack} />

      <div className="px-4 mt-4">
        {/* Payment method */}
        <div className="p-4 rounded-card glass mb-4">
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-3">Payment Method</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-vred/20 flex items-center justify-center">
              <Wallet size={18} className="text-vred" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Razorpay</div>
              <div className="text-[11px] text-vmuted">Connected · auto-pay enabled</div>
            </div>
            <button className="px-3 py-1.5 rounded-full glass text-[11px] font-bold text-white active:scale-95">
              Manage
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-card glass">
            <div className="text-[10px] text-vmuted">Total Spend (2024)</div>
            <div className="text-lg font-black text-vgold">₹98,200</div>
          </div>
          <div className="p-3.5 rounded-card glass">
            <div className="text-[10px] text-vmuted">Pending</div>
            <div className="text-lg font-black text-white">₹0</div>
          </div>
        </div>

        {/* Invoices */}
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Invoice History</h3>
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-3.5 rounded-card glass">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <CreditCard size={16} className="text-vmuted" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">{inv.id}</div>
                <div className="text-[11px] text-vmuted">{inv.date}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white">{inv.amount}</div>
                <span className="text-[9px] font-bold text-green-400">{inv.status}</span>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg glass active:scale-90 transition">
                <Download size={14} className="text-vmuted" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
