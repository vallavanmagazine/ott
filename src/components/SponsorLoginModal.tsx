import { useState } from 'react';
import { X, Mail, Building2, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function SponsorLoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? 'Login failed.'); return; }
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
          <div className="animate-fade-in space-y-3">
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
            <div>
              <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold flex items-center gap-1">
                <Lock size={10} /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                className="w-full mt-1.5 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vgold"
              />
            </div>
            {error && (
              <p className="text-[11px] text-red-400 text-center bg-red-500/10 rounded-lg py-2 px-3">{error}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loading || email.length < 3 || password.length < 1}
              className="w-full py-3 rounded-full bg-vgold text-black font-bold text-sm active:scale-95 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in…' : <>Sign In <ArrowRight size={14} /></>}
            </button>
            <p className="text-[10px] text-vmuted text-center">
              Viewing Vallavan is always free. Login is only needed for sponsor tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
