import { useState } from 'react';
import { Building2, ShieldCheck, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { sendOtp, verifyOtp, registerSponsorKyc } from '@/services/kyc';

const BUSINESS_TYPES = ['Retail', 'Restaurant', 'Services', 'Healthcare', 'Education', 'Real Estate', 'Other'];

export function SponsorKycScreen({ onBack, onDone }: { onBack: () => void; onDone?: () => void }) {
  const [step, setStep] = useState<'kyc' | 'otp' | 'done'>('kyc');
  const [form, setForm] = useState({ businessName: '', ownerName: '', email: '', phone: '', gstNumber: '', businessType: 'Retail' });
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const proceedToOtp = async () => {
    setError(null);
    if (!form.businessName.trim() || !form.ownerName.trim() || !form.email.trim() || form.phone.trim().length < 10) {
      setError('Fill business name, owner, email, and a valid 10-digit phone.'); return;
    }
    setBusy(true);
    try {
      await sendOtp(form.phone);
      setOtpSent(true);
      setStep('otp');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    setError(null);
    setBusy(true);
    try {
      const ok = await verifyOtp(form.phone, otp);
      if (!ok) { setError('Incorrect OTP. Try again.'); setBusy(false); return; }
      await registerSponsorKyc(form);
      setStep('done');
      onDone?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Sponsor Signup (KYC)" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        {step === 'kyc' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><Building2 size={18} className="text-vgold" /></div>
              <div>
                <div className="text-sm font-black text-white">Business Details</div>
                <div className="text-[11px] text-vmuted">Verified once with a phone OTP.</div>
              </div>
            </div>
            <div className="space-y-3">
              <Field label="Business Name" value={form.businessName} onChange={set('businessName')} placeholder="e.g. Kumar Textiles" />
              <Field label="Owner Name" value={form.ownerName} onChange={set('ownerName')} placeholder="Full name" />
              <Field label="Email" value={form.email} onChange={set('email')} placeholder="you@business.com" type="email" />
              <Field label="Phone (for OTP)" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" type="tel" />
              <Field label="GST Number (optional)" value={form.gstNumber} onChange={set('gstNumber')} placeholder="33ABCDE1234F1Z5" />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Business Type</label>
                <select value={form.businessType} onChange={set('businessType')} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none">
                  {BUSINESS_TYPES.map((t) => <option key={t} className="bg-vblack">{t}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
            <button onClick={proceedToOtp} disabled={busy} className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
              {busy ? 'Sending OTP…' : 'Send OTP & Continue'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><ShieldCheck size={18} className="text-vgold" /></div>
              <div>
                <div className="text-sm font-black text-white">Verify Phone</div>
                <div className="text-[11px] text-vmuted">{otpSent ? `Code sent to ${form.phone}` : ''}</div>
              </div>
            </div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Enter OTP</label>
            <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" inputMode="numeric" className="w-full mt-1 px-4 py-3 rounded-xl glass text-lg tracking-[0.3em] text-center text-white outline-none" />
            {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
            <button onClick={confirmOtp} disabled={busy || otp.length < 4} className="w-full mt-4 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
              {busy ? 'Verifying…' : 'Verify & Create Account'}
            </button>
            <button onClick={() => setStep('kyc')} className="w-full mt-2 py-2.5 text-xs text-vmuted font-bold">Edit details</button>
          </>
        )}

        {step === 'done' && (
          <div className="mt-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-4"><Check size={32} className="text-green-400" /></div>
            <h2 className="text-lg font-black text-white">You're verified!</h2>
            <p className="text-sm text-vmuted mt-1 max-w-xs">Your sponsor account for <span className="text-white font-bold">{form.businessName}</span> is ready. Top up your wallet to launch campaigns.</p>
            <button onClick={onBack} className="mt-6 px-8 py-3 rounded-full bg-vred text-white font-bold text-sm">Go to Dashboard</button>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none" />
    </div>
  );
}
