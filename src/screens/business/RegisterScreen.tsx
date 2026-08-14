import { useState } from 'react';
import { UserPlus, ShieldCheck, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { tamilNaduDistricts } from '@/data/mockData';
import { startRegistration, completeRegistration, isValidEmail, type RegisterRole, type OtpChannel } from '@/services/registration';
import { DownloadAppCard } from '@/components/GetApp';

type Step = 'form' | 'otp' | 'done';

/** Registration for sponsor + freelancer. OTP to mobile (Fast2SMS) or email fallback. */
export function RegisterScreen({ role, onBack }: { role: RegisterRole; onBack: () => void }) {
  const [step, setStep] = useState<Step>('form');
  const [channel, setChannel] = useState<OtpChannel>('sms');
  const [form, setForm] = useState({ name: '', phone: '', email: '', district: 'Chennai' });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSponsor = role === 'sponsor';
  const title = isSponsor ? 'Register as Sponsor' : 'Register as Freelancer';
  const inp = 'w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none';

  const start = async () => {
    setError(null);
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (form.phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!isValidEmail(form.email)) { setError('Please enter a valid email address.'); return; }
    setBusy(true);
    const res = await startRegistration({ role, ...form });
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Could not send OTP.'); return; }
    setChannel(res.channel ?? 'email');
    setCode('');
    setStep('otp');
  };

  const verify = async () => {
    setError(null); setBusy(true);
    const res = await completeRegistration({ role, ...form }, code, channel);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Verification failed.'); return; }
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-vblack">
        <SubPageHeader title={title} onBack={onBack} />
        <div className="px-4 mt-8 max-w-[560px] mx-auto w-full">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mb-3"><Check size={28} className="text-green-400" /></div>
            <h2 className="text-lg font-black text-white">Account created!</h2>
            <p className="text-sm text-vmuted mt-1">Welcome, {form.name}.</p>
          </div>
          <DownloadAppCard
            title={isSponsor ? 'Open your Sponsor Dashboard' : 'Open your Freelancer Dashboard'}
            subtitle={isSponsor
              ? 'Download the Vallavan app to complete your business profile, top up your wallet, and launch campaigns.'
              : 'Download the Vallavan app to complete your profile (roles, experience, portfolio) and pick up tasks.'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title={title} onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        {step === 'form' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><UserPlus size={18} className="text-vgold" /></div>
              <div><div className="text-sm font-black text-white">Create your account</div><div className="text-[11px] text-vmuted">We'll send a one-time code to verify you.</div></div>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isSponsor ? 'Key Person Name *' : 'Full Name *'} className={inp} />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile *" type="tel" inputMode="numeric" className={inp} />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={isSponsor ? 'Official / Company Email *' : 'Email *'} type="email" className={inp} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">District</label>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={`${inp} mt-1`}>
                  {tamilNaduDistricts.map((d) => <option key={d} value={d} className="bg-vblack">{d}</option>)}
                </select>
              </div>
              {error && <p className="text-[11px] text-vred">{error}</p>}
              <button onClick={start} disabled={busy} className="w-full py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
                {busy ? 'Sending OTP…' : 'Register'}
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><ShieldCheck size={18} className="text-vgold" /></div>
              <div>
                <div className="text-sm font-black text-white">Enter the code</div>
                <div className="text-[11px] text-vmuted">{channel === 'sms' ? `OTP sent to your mobile ${form.phone}` : `Verification code sent to your email ${form.email}`}</div>
              </div>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code" inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl glass text-lg tracking-[0.3em] text-center text-white outline-none"
            />
            {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
            <button onClick={verify} disabled={busy || code.length < 4} className="w-full mt-4 py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
              {busy ? 'Verifying…' : 'Verify & Create Account'}
            </button>
            <button onClick={() => { setStep('form'); setError(null); }} className="w-full mt-2 py-2.5 text-xs text-vmuted font-bold">Edit details</button>
          </>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
