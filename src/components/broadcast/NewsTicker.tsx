import type { TickerItem } from '@/services/ticker';

/** Continuously scrolling news ticker (manual + RSS items). */
export function NewsTicker({ items, speed = 'medium', inline = false }: { items: TickerItem[]; speed?: string; inline?: boolean }) {
  if (items.length === 0) return null;
  const speedClass = speed === 'slow' ? 'ticker-slow' : speed === 'fast' ? 'ticker-fast' : 'ticker-medium';
  // Duplicate the list so the -50% marquee loops seamlessly.
  const doubled = [...items, ...items];
  // `inline` renders the ticker as a standalone strip below the video (mobile);
  // the default pins it to the bottom of the picture (desktop overlay).
  const box = inline
    ? 'relative w-full rounded-lg border border-vred/40'
    : 'absolute bottom-0 left-0 right-0 z-20 border-t border-vred/40';

  return (
    <div className={`${box} bg-black/85 backdrop-blur-sm overflow-hidden h-9 flex items-center`}>
      <div className="bg-vred h-full flex items-center px-3 flex-shrink-0 z-10">
        <span className="text-white text-[10px] font-black tracking-widest">NEWS</span>
      </div>
      <div className={`ticker-track ${speedClass}`}>
        {doubled.map((it, i) => (
          <span key={i} className="text-white text-xs font-medium px-6 inline-flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-vgold mr-2" />
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}
