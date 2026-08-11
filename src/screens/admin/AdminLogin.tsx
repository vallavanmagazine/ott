import { useState } from 'react';
import { Lock, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { LogoMark } from '@/components/Logo';

export function AdminLogin({ onLogin, onExit }: { onLogin: () => void; onExit: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <div className="min-h-screen bg-vblack flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <LogoMark size={48} />
          <div className="mt-3 flex items-center gap-2">
            <ShieldCheck size={18} className="text-vred" />
            <h1 className="text-lg font-black text-white">Vallavan Admin</h1>
          </div>
          <p className="text-xs text-vmuted mt-1">Internal access only — authorized personnel</p>
        </div>

        <div className="rounded-2xl glass-strong p-5 border border-white/10">
          <div className="mb-4">
            <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vallavan.in"
              className="w-full mt-1.5 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred"
            />
          </div>
          <div className="mb-4">
            <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold flex items-center gap-1">
              <Lock size={10} /> Password
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1.5 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred"
            />
          </div>
          <button
            onClick={onLogin}
            className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-2 shadow-glow"
          >
            Sign In <ArrowRight size={14} />
          </button>
          <p className="text-[10px] text-vgold text-center mt-3">Demo — tap Sign In to enter</p>
        </div>

        <button
          onClick={onExit}
          className="w-full mt-4 py-2 text-xs font-semibold text-vmuted flex items-center justify-center gap-1"
        >
          <X size={12} /> Back to App
        </button>
      </div>
    </div>
  );
}
