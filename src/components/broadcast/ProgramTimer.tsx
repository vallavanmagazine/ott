import type { LiveSlot } from '@/data/mockData';

/** Time-remaining bar for the current program. */
export function ProgramTimer({ current, progress }: { current: LiveSlot | null; progress: number }) {
  if (!current) return null;
  const durMatch = current.duration.match(/(\d+)/);
  const totalMin = durMatch ? parseInt(durMatch[1], 10) : 30;
  const remaining = Math.max(0, Math.round(totalMin * (1 - progress)));
  return (
    <div className="absolute top-3 right-3 z-20 pointer-events-none">
      <div className="flex items-center gap-2 rounded-full bg-black/70 px-2.5 py-1">
        <div className="w-16 h-1 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-vred" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <span className="text-white text-[10px] font-bold">{remaining}m left</span>
      </div>
    </div>
  );
}
