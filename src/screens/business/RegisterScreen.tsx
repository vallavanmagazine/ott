import { useState } from 'react';
import { UserPlus, ShieldCheck, Mail, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { tamilNaduDistricts } from '@/data/mockData';
import { FREELANCER_ROLES } from '@/services/freelancer';
import {
  sendOTP, verifyOTP, sendEmailOTP, verifyEmailOTP,
  createSponsorAccount, createFreelancerAccount,
} from '@/services/auth-phone';
import { DownloadAppCard } from '@/components/GetApp';

type Role = 'sponsor' | 'freelancer';
type Step = 'form' | 'otp-phone' | 'otp-email' | 'done';

function isValidEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

/**
 * Registration with BOTH phone and email OTP (no Supabase Auth). Flow is
 * sequential: form → verify phone → verify email → create account. The account
 * is only created in the email-verify step, so it is impossible to complete
 * registration without both factors verified.
 */
export function RegisterScreen({ role, onBack }: { role: Role; onBack: () => void }) {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState({ name: '', phone: '', email: '', district: 'Chennai', roles: [] as string[] });
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const isSponsor = role === 'sponsor';
  const title = isSponsor ? 'Register as Sponsor' : 'Register as Freelancer';
  const inp = 'w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none';

  const toggleRole = (r: string) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }));

  // form → send phone OTP
  const send = async () => {
    setError(null);
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (form.phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    if (!isValidEmail(form.email)) { setError('Please enter a valid email address.'); return; }
    if (!isSponsor && form.roles.length === 0) { setError('Please pick at least one role.'); return; }
    setBusy(true);
    const res = await sendOTP(form.phone);
    setBusy(false);
    if (!res.ok) { setError(res.error ?? 'Could not send the mobile OTP.'); return; }
    if (res.testMode && res.testCode) { alert(`SMS not configured. Using test OTP: ${res.testCode}`); setCode(res.testCode); }
    setPhoneVerified(false);
    setStep('otp-phone');
  };

  // verify phone → send email OTP
  const verifyPhone = async () => {
    setError(null); setBusy(true);
    try {
      const ok = await verifyOTP(form.phone, code);
      if (!ok) { setError('That mobile OTP is incorrect or expired.'); return; }
      setPhoneVerified(true);
      const res = await sendEmailOTP(form.email);
      if (!res.ok) { setError(res.error ?? 'Could not send the email code.'); return; }
      setCode('');
      if (res.testMode && res.testCode) { alert(`Email not configured. Using test code: ${res.testCode}`); setCode(res.testCode); }
      setStep('otp-email');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // verify email → create account (requires phone already verified)
  const verifyEmailAndCreate = async () => {
    setError(null); setBusy(true);
    try {
      if (!phoneVerified) { setError('Please verify your mobile first.'); setStep('otp-phone'); return; }
      const ok = await verifyEmailOTP(form.email, code);
      if (!ok) { setError('That email code is incorrect or expired.'); return; }
      if (isSponsor) await createSponsorAccount(form);
      else await createFreelancerAccount({ ...form, roles: form.roles });
      setStep('done');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-vblack">
        <SubPageHeader title={title} onBack={onBack} />
        <div className="px-4 mt-8 max-w-[560px] mx-auto w-full">
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mb-3"><Check size={28} className="text-green-400" /></div>
            <h2 className="text-lg font-black text-white">Account created!</h2>
            <p className="text-sm text-vmuted mt-1">Welcome, {form.name}. Phone and email verified.</p>
          </div>
          <DownloadAppCard
            title={isSponsor ? 'Open your Sponsor Dashboard' : 'Open your Freelancer Dashboard'}
            subtitle={isSponsor
              ? 'Download the Vallavan app to top up your wallet, create campaigns, and view analytics.'
              : 'Download the Vallavan app to complete your profile and pick up tasks.'}
          />
        </div>
      </div>
    );
  }

  const otpStep = step === 'otp-phone' || step === 'otp-email';

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title={title} onBack={onBack} />
      <div className="px-4 mt-4 max-w-[560px] mx-auto w-full">
        {step === 'form' && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-vgold/20 flex items-center justify-center"><UserPlus size={18} className="text-vgold" /></div>
              <div><div className="text-sm font-black text-white">Create your account</div><div className="text-[11px] text-vmuted">We'll verify your mobile and email with one-time codes.</div></div>
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
              {!isSponsor && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Roles applying for *</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {FREELANCER_ROLES.map((r) => (
                      <button key={r} onClick={() => toggleRole(r)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${form.roles.includes(r) ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{r}</button>
                    ))}
                  </div>
                </div>
              )}
              {error && <p className="text-[11px] text-vred">{error}</p>}
              <button onClick={send} disabled={busy} className="w-full py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">
                {busy ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </div>
          </>
        )}

        {otpStep && (
          <>
            {/* progress: phone ✓ then email */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`flex items-center gap-1 text-[11px] font-bold ${phoneVerified ? 'text-green-400' : 'text-vgold'}`}>
                <ShieldCheck size={13} /> Mobile {phoneVerified ? '✓' : '1'}
              </span>
              <span className="text-vmuted">→</span>
              <span className={`flex items-center gap-1 text-[11px] font-bold ${step === 'otp-email' ? 'text-vgold' : 'text-vmuted'}`}>
                <Mail size={13} /> Email 2
              </span>
            </div>
            <div className="mb-3">
              <div className="text-sm font-black text-white">{step === 'otp-phone' ? 'Verify your mobile' : 'Verify your email'}</div>
              <div className="text-[11px] text-vmuted">
                {step === 'otp-phone' ? `Code sent to +91 ${form.phone.replace(/\D/g, '').slice(-10)}` : `Code sent to ${form.email}`}
              </div>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code" inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl glass text-lg tracking-[0.3em] text-center text-white outline-none"
            />
            {error && <p className="text-[11px] text-vred mt-3">{error}</p>}
            <button
              onClick={step === 'otp-phone' ? verifyPhone : verifyEmailAndCreate}
              disabled={busy || code.length < 6}
              className="w-full mt-4 py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50"
            >
              {busy ? 'Verifying…' : step === 'otp-phone' ? 'Verify Mobile → Email' : 'Verify Email & Register'}
            </button>
            <button onClick={() => { setStep('form'); setError(null); setCode(''); setPhoneVerified(false); }} className="w-full mt-2 py-2.5 text-xs text-vmuted font-bold">Edit details</button>
          </>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
