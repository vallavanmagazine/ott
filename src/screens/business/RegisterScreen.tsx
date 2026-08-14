import { useState } from 'react';
import { UserPlus, ShieldCheck, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { tamilNaduDistricts } from '@/data/mockData';
import {
  sendMobileOtp, verifyMobileOtp, sendEmailOtp, verifyEmailOtpAndCreateProfile,
  phoneOtpAvailable, type RegisterRole,
} from '@/services/registration';
import { DownloadAppCard } from '@/components/GetApp';

type Step = 'form' | 'mobile-otp' | 'email-otp' | 'done';

/**
 * Registration for returning-less users (FIX: no signup existed). Sponsor +
 * freelancer share this screen. Mobile OTP (Fast2SMS) is verified first when
 * available; the account is created via Supabase email OTP.
 */
export function RegisterScreen({ role, onBack, onRegistered }: { role: RegisterRole; onBack: () => void; onRegistered?: () => void }) {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ name: '', phone: '', email: '', district: 'Chennai' });
  const [mobileCode, setMobileCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSponsor = role === 'sponsor';
  const title = isSponsor ? 'Register as Sponsor' : 'Register as Freelancer';
  const inp = 'w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none';

  const startRegister = async () => {
    setError(null);
    if (!form.name.trim() || form.phone.trim().length < 10 || !form.email.trim()) {
      setError('Name, a valid 10-digit mobile, and email are required.'); return;
    }
    setBusy(true);
    try {
      if (phoneOtpAvailable()) {
        await sendMobileOtp(form.phone);
        setStep('mobile-otp');
      } else {
        await sendEmailOtp({ role, ...form });
        setStep('email-otp');
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const confirmMobile = async () => {
    setError(null); setBusy(true);
    try {
      const ok = await verifyMobileOtp(form.phone, mobileCode);
      if (!ok) { setError('Incorrect mobile OTP.'); setBusy(false); return; }
      await sendEmailOtp({ role, ...form });
      setStep('email-otp');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  const confirmEmail = async () => {
    setError(null); setBusy(true);
    try {
      await verifyEmailOtpAndCreateProfile({ role, ...form }, emailCode.trim());
      setStep('done');
      onRegistered?.();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-vblack">
        <SubPageHeader title={title} onBack={onBack} />
        <div className="px-4 mt-8 max-w-[560px] mx-auto w-full">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mb-3"><Check size={28} className="text-green-400" /></div>
            <h2 className="text-lg font-black text-white">Account created!</h2>
            <p className="text-sm text-vmuted mt-1">You're signed in as {form.name}.</p>
          </div>
          <DownloadAppCard
            title={isSponsor ? 'Open your Sponsor Dashboard' : 'Open your Freelancer Dashboard'}
            subtitle={isSponsor
              ? 'Download the Vallavan app to complete your business profile (GST, business type), top up your wallet, and launch campaigns.'
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
              <div><div className="text-sm font-black text-white">Create your account</div><div className="text-[11px] text-vmuted">Mobile verification required.</div></div>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={isSponsor ? 'Key Person Name *' : 'Full Name *'} className={inp} />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile *" type="tel" className={inp} />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={isSponsor ? 'Official / Company Email *' : 'Email *'} type="email" className={inp} />
              <div>
                <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">District</label>
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={`${inp} mt-1`}>
                  {tamilNaduDistricts.map((d) => <option key={d} value={d} className="bg-vblack">{d}</option>)}
                </select>
              </div>
              {error && <p className="text-[11px] text-vred">{error}</p>}
              <button onClick={startRegister} disabled={busy} className="w-full py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
                {busy ? 'Please wait…' : 'Register'}
              </button>
              {!phoneOtpAvailable() && <p className="text-[10px] text-vmuted text-center">Mobile OTP unavailable — we'll verify by email instead.</p>}
            </div>
          </>
        )}

        {(step === 'mobile-otp' || step === 'email-otp') && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><ShieldCheck size={18} className="text-vgold" /></div>
              <div>
                <div className="text-sm font-black text-white">{step === 'mobile-otp' ? 'Verify your mobile' : 'Verify your email'}</div>
                <div className="text-[11px] text-vmuted">Code sent to {step === 'mobile-otp' ? form.phone : form.email}</div>
              </div>
            </div>
            <input
              value={step === 'mobile-otp' ? mobileCode : emailCode}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); step === 'mobile-otp' ? setMobileCode(v) : setEmailCode(v); }}
              placeholder="6-digit code" inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl glass text-lg tracking-[0.3em] text-center text-white outline-none"
            />
            {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
            <button onClick={step === 'mobile-otp' ? confirmMobile : confirmEmail} disabled={busy} className="w-full mt-4 py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
              {busy ? 'Verifying…' : step === 'mobile-otp' ? 'Verify Mobile' : 'Verify & Create Account'}
            </button>
            <button onClick={() => setStep('form')} className="w-full mt-2 py-2.5 text-xs text-vmuted font-bold">Edit details</button>
          </>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
