import type { LiveSlot } from '@/data/mockData';

/** Transition card shown ~30s before the current program ends. */
export function ComingUpNext({ next }: { next: LiveSlot | null }) {
  if (!next) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-fade-in">
      <div className="bg-black/85 backdrop-blur-md rounded-2xl px-8 py-6 text-center border border-white/10 shadow-2xl">
        <div className="text-vgold text-[11px] font-black tracking-widest uppercase mb-2">Coming Up Next</div>
        <div className="text-white text-xl font-black">{next.title}</div>
        <div className="text-vgold font-tamil text-sm mt-0.5">{next.titleTa}</div>
        <div className="text-vmuted text-xs mt-2">{next.time} · {next.duration}</div>
      </div>
    </div>
  );
}
