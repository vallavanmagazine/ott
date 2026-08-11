import { useState } from 'react';
import { X, Mail, Building2, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SponsorLoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);

  const setDigit = (i: number, v: string) => {
    if (v.length > 1) return;
    const next = [...otp];
    next[i] = v;
    setOtp(next);
  };

  const complete = () => {
    login(email || 'sponsor@vallavan.in', company || 'Sponsor Account');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-vblack rounded-2xl border border-white/10 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="relative p-5 border-b border-white/8">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full glass active:scale-90"
          >
            <X size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-vgold/20 flex items-center justify-center">
              <Building2 size={16} className="text-vgold" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Sponsor Login</h2>
              <p className="text-[11px] text-vmuted">For advertisers & business accounts</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {step === 'input' ? (
            <div className="animate-fade-in space-y-3">
              <div>
                <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Company Name</label>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Tamil Tea Co."
                  className="w-full mt-1.5 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vgold"
                />
              </div>
              <div>
                <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold flex items-center gap-1">
                  <Mail size={10} /> Work Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.in"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vgold"
                />
              </div>
              <button
                onClick={() => setStep('otp')}
                disabled={email.length < 3}
                className="w-full py-3 rounded-full bg-vgold text-black font-bold text-sm active:scale-95 transition disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Send Verification Code <ArrowRight size={14} />
              </button>
              <p className="text-[10px] text-vmuted text-center">
                Viewing Vallavan is always free. Login is only needed for sponsor tools.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p className="text-sm text-vmuted mb-1">Enter the code sent to</p>
              <p className="text-sm font-bold text-white mb-4">{email}</p>
              <div className="flex gap-2.5 justify-center mb-4">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    type="tel"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    className="w-11 h-14 rounded-xl glass text-center text-lg font-black text-white outline-none focus:border-vgold"
                  />
                ))}
              </div>
              <button
                onClick={complete}
                className="w-full py-3 rounded-full bg-vgold text-black font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Check size={16} /> Verify & Continue
              </button>
              <button
                onClick={() => setStep('input')}
                className="w-full mt-2 py-2 text-xs font-semibold text-vmuted"
              >
                Use a different email
              </button>
              <p className="text-[10px] text-vgold text-center mt-2">Demo — tap Verify to continue</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
