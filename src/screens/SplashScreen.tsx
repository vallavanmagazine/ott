import { useEffect, useState } from 'react';
import { Newspaper, Radio, FileText, Tv } from 'lucide-react';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2800);
    const t2 = setTimeout(onDone, 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  const orbitIcons = [
    { Icon: Newspaper, color: '#D32F2F', delay: '0s', reverse: false },
    { Icon: FileText, color: '#D4AF37', delay: '0.3s', reverse: true },
    { Icon: Radio, color: '#E53935', delay: '0.6s', reverse: false },
    { Icon: Tv, color: '#D4AF37', delay: '0.9s', reverse: true },
  ];

  return (
    <div
      className={`fixed inset-0 z-[100] bg-vblack flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Radial glow background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-[280px] h-[280px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(211,47,47,0.15) 0%, transparent 70%)' }}
        />
      </div>

      {/* Center icon + orbiting content icons */}
      <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
        {/* Orbiting content-type icons */}
        {orbitIcons.map(({ Icon, color, delay, reverse }, i) => (
          <div
            key={i}
            className={`absolute ${reverse ? 'animate-splash-orbit-rev' : 'animate-splash-orbit'}`}
            style={{ animationDelay: delay, transformOrigin: 'center' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center glass-strong"
              style={{ boxShadow: `0 0 12px -2px ${color}66` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
          </div>
        ))}

        {/* Center Vallavan icon */}
        <div className="relative animate-splash-icon-spin">
          <div className="animate-splash-icon-glow">
            <img
              src="/icons/vallavanicon.webp"
              width={80}
              height={80}
              alt="Vallavan"
              className="rounded-2xl object-cover"
            />
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-vred/30 animate-pulse-live" />
        </div>
      </div>

      {/* Typewriter title */}
      <div className="mt-8 text-center">
        <h1
          className="text-3xl sm:text-4xl font-black tracking-[0.2em] text-white splash-type"
          style={{ maxWidth: 'fit-content' }}
        >
          VALLAVAN
        </h1>
        <div className="mt-2 overflow-hidden">
          <p className="text-[10px] sm:text-[11px] tracking-[0.3em] text-vmuted font-medium uppercase animate-slide-up" style={{ animationDelay: '1.2s', animationFillMode: 'backwards', opacity: 0 }}>
            News · Articles · Live Coverage
          </p>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="mt-8 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-vred rounded-full animate-splash-progress" />
      </div>

      {/* Floating content icons at bottom */}
      <div className="absolute bottom-20 flex items-center gap-6">
        {[
          { Icon: Newspaper, label: 'News', delay: '1.5s' },
          { Icon: FileText, label: 'Articles', delay: '1.8s' },
          { Icon: Radio, label: 'Live', delay: '2.1s' },
        ].map(({ Icon, label, delay }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 animate-splash-pop-in"
            style={{ animationDelay: delay, animationFillMode: 'backwards', opacity: 0 }}
          >
            <div className="w-10 h-10 rounded-full glass flex items-center justify-center animate-splash-float" style={{ animationDelay: delay }}>
              <Icon size={18} className="text-vred" />
            </div>
            <span className="text-[9px] font-bold text-vmuted tracking-wider uppercase">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
