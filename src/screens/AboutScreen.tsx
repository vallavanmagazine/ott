import { Heart } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { LogoMark } from '@/components/Logo';

export const APP_VERSION = '2.1.0';

export function AboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="About Vallavan" onBack={onBack} />
      <div className="px-4 mt-6 max-w-[600px] mx-auto w-full">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={64} />
          <h1 className="text-2xl font-black text-white mt-4 tracking-wide">VALLAVAN</h1>
          <p className="text-[11px] tracking-[0.25em] text-vmuted uppercase mt-1">Documentaries That Matter</p>
          <span className="mt-3 px-2.5 py-1 rounded-full glass text-[11px] font-bold text-vmuted">Version {APP_VERSION}</span>
        </div>

        <div className="mt-8 p-4 rounded-card glass">
          <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2"><Heart size={15} className="text-vred" fill="currentColor" /> Our Mission</h3>
          <p className="text-[13px] text-white/85 leading-relaxed">
            Vallavan is a Tamil-first documentary platform — telling the stories of our land, people,
            and ideas that matter. Free for everyone, supported by sponsors, so knowledge and culture
            reach every corner of Tamil Nadu.
          </p>
        </div>

        <div className="mt-4 p-4 rounded-card glass text-[12px] text-vmuted leading-relaxed">
          <p>Long-form documentaries, short-form Feed, and 24/7 VALLAVAN TV.</p>
          <p className="mt-2">© {new Date().getFullYear()} Vallavan. Made in Tamil Nadu.</p>
        </div>
      </div>
      <div className="h-8" />
    </div>
  );
}
