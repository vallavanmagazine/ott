import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { tamilNaduDistricts } from '@/data/mockData';
import { registerSponsorKyc } from '@/services/kyc';
import { DownloadAppCard } from '@/components/GetApp';

export const BUSINESS_TYPES = ['Restaurant', 'Shop', 'Service', 'Brand', 'Other'];

/**
 * Sponsor signup form (FIX 3 — identical fields on web + mobile). On web there
 * is NO dashboard: after submit we point the user to the app (FIX 2/6).
 */
export function SponsorSignupScreen({ onBack }: { onBack: () => void }) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: '', ownerName: '', phone: '', email: '',
    businessType: 'Restaurant', district: 'Chennai', gstNumber: '', agree: false,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: k === 'agree' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async () => {
    setError(null);
    if (!form.businessName.trim() || !form.ownerName.trim() || form.phone.trim().length < 10 || !form.email.trim()) {
      setError('Business name, owner, a valid phone, and email are required.'); return;
    }
    if (!form.agree) { setError('Please agree to the Terms to continue.'); return; }
    setBusy(true);
    try {
      await registerSponsorKyc({
        businessName: form.businessName, ownerName: form.ownerName, email: form.email, phone: form.phone,
        businessType: form.businessType, district: form.district, gstNumber: form.gstNumber || undefined,
      });
      setDone(true);
    } catch (e) {
      setError(`Signup failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const inp = 'w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none';

  if (done) {
    return (
      <div className="min-h-screen bg-vblack">
        <SubPageHeader title="Become a Sponsor" onBack={onBack} />
        <div className="px-4 mt-8 max-w-[560px] mx-auto w-full">
          <DownloadAppCard
            title="You're registered! 🎉"
            subtitle="Download the Vallavan app to open your Sponsor Dashboard — top up your wallet, create campaigns, use AI Studio, and view analytics."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Become a Sponsor" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><Building2 size={18} className="text-vgold" /></div>
          <div><div className="text-sm font-black text-white">Business Details</div><div className="text-[11px] text-vmuted">Reach Tamil viewers by district.</div></div>
        </div>
        <div className="space-y-3">
          <input value={form.businessName} onChange={set('businessName')} placeholder="Business Name *" className={inp} />
          <input value={form.ownerName} onChange={set('ownerName')} placeholder="Owner Name *" className={inp} />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone *" type="tel" className={inp} />
          <input value={form.email} onChange={set('email')} placeholder="Email *" type="email" className={inp} />
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Business Type</label>
            <select value={form.businessType} onChange={set('businessType')} className={`${inp} mt-1`}>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t} className="bg-vblack">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">District</label>
            <select value={form.district} onChange={set('district')} className={`${inp} mt-1`}>
              {tamilNaduDistricts.map((d) => <option key={d} value={d} className="bg-vblack">{d}</option>)}
            </select>
          </div>
          <input value={form.gstNumber} onChange={set('gstNumber')} placeholder="GST Number (optional)" className={inp} />
          <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer">
            <input type="checkbox" checked={form.agree} onChange={set('agree')} className="w-4 h-4 accent-vred" />
            <span className="text-xs text-white/90">I agree to the <span className="text-vgold font-semibold">Terms &amp; Conditions</span>.</span>
          </label>
          {error && <p className="text-[11px] text-vred">{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
            {busy ? 'Submitting…' : 'Submit'}
          </button>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
