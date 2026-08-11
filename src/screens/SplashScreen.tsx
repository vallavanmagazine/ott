import { useEffect, useState } from 'react';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1400);
    const t2 = setTimeout(onDone, 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-vblack flex flex-col items-center justify-center transition-opacity duration-500 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="animate-fade-in flex flex-col items-center">
        <img
          src="/icons/logo-mark.svg"
          width={88}
          height={88}
          alt="Vallavan"
          className="drop-shadow-[0_0_30px_rgba(211,47,47,0.4)]"
        />
        <div className="mt-5 text-center">
          <div className="text-2xl sm:text-3xl font-black tracking-[0.15em] text-white">VALLAVAN</div>
          <div className="mt-1 text-[9px] sm:text-[10px] tracking-[0.3em] text-vmuted font-medium uppercase">
            Documentaries That Matter
          </div>
        </div>
        <div className="mt-8 w-8 h-0.5 bg-vred rounded-full overflow-hidden">
          <div className="w-full h-full bg-vred animate-pulse" />
        </div>
      </div>
    </div>
  );
}
