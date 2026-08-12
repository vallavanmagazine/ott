/** "Ad 1 of 3 · Program resumes in 45s" overlay during ad breaks. */
export function AdCountdown({ index, total, secondsLeft }: { index: number; total: number; secondsLeft: number }) {
  return (
    <div className="absolute top-3 left-3 z-30 pointer-events-none">
      <div className="flex items-center gap-2 rounded-full bg-black/80 backdrop-blur-sm px-3 py-1.5 border border-vgold/40">
        <span className="px-1.5 py-0.5 rounded bg-vgold text-black text-[9px] font-black uppercase">Ad {index} of {total}</span>
        <span className="text-white text-[11px] font-semibold">Program resumes in {secondsLeft}s</span>
      </div>
    </div>
  );
}
