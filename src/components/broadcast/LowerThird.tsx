import type { LiveSlot } from '@/data/mockData';

/**
 * NOW / NEXT lower-third, auto-populated from the schedule.
 *
 * Anchored bottom-RIGHT: the bottom-left of the video is occupied by the hero
 * title block (title, synopsis, progress, player controls), which this used to
 * sit directly on top of. It also stays above the channel bug, and its width is
 * capped at the narrower breakpoints so a long program name can never grow far
 * enough left to reach the title block again.
 *
 * Rendered only from `md:` up — on mobile the same information is the
 * `NowNextPanel` strip below the video.
 */
export function LowerThird({ current, next }: { current: LiveSlot | null; next: LiveSlot | null }) {
  if (!current) return null;
  return (
    <div className="absolute bottom-28 right-3 max-w-[264px] lg:max-w-md z-20 pointer-events-none animate-slide-up">
      <div className="rounded-lg overflow-hidden shadow-xl">
        <div className="flex items-stretch">
          <div className="bg-vred px-3 py-2 flex items-center">
            <span className="text-white text-[10px] font-black tracking-widest">NOW</span>
          </div>
          <div className="flex-1 bg-black/80 backdrop-blur-sm px-3 py-2">
            <div className="text-white font-bold text-sm leading-tight truncate">{current.title}</div>
            <div className="text-vgold font-tamil text-[11px] leading-tight truncate">{current.titleTa}</div>
          </div>
        </div>
        {next && (
          <div className="flex items-stretch border-t border-white/10">
            <div className="bg-vgold px-3 py-1 flex items-center">
              <span className="text-black text-[9px] font-black tracking-widest">NEXT</span>
            </div>
            <div className="flex-1 bg-black/70 px-3 py-1">
              <span className="text-white/90 text-[11px] font-semibold">{next.title}</span>
              <span className="text-vmuted text-[10px] ml-2">{next.time}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
