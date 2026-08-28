import type { LiveSlot } from '@/data/mockData';
import type { BroadcastState } from '@/hooks/useBroadcast';
import { NewsTicker } from './NewsTicker';
import { weatherIcon } from './weatherIcon';

/**
 * Mobile-only (< 768px) counterparts to the desktop broadcast overlay.
 *
 * On a phone the video box is far too small to carry the full graphics package,
 * so the same information is laid out as discrete, non-overlapping strips BELOW
 * the picture. All of it is `md:hidden` — from tablet up the overlay takes over.
 */

/** NOW / NEXT program panel — sits directly under the video. */
export function NowNextPanel({ current, next }: { current: LiveSlot | null; next: LiveSlot | null }) {
  if (!current) return null;
  return (
    <section className="md:hidden px-4 mt-3">
      <div className="rounded-card glass-strong overflow-hidden">
        <div className="flex items-start gap-2.5 p-3">
          <span className="px-2 py-1 rounded bg-vred text-white text-[9px] font-black tracking-widest flex-shrink-0">NOW</span>
          <div className="min-w-0">
            <div className="text-white font-black text-sm leading-tight truncate">{current.title}</div>
            <div className="text-vgold font-tamil text-xs leading-tight truncate">{current.titleTa}</div>
          </div>
        </div>
        {next && (
          <div className="flex items-center gap-2.5 px-3 py-2 border-t border-white/10">
            <span className="px-2 py-0.5 rounded bg-vgold text-black text-[9px] font-black tracking-widest flex-shrink-0">NEXT</span>
            <span className="text-white/90 text-xs font-semibold truncate">{next.title}</span>
            <span className="text-vmuted text-[11px] ml-auto flex-shrink-0">{next.time}</span>
          </div>
        )}
      </div>
    </section>
  );
}

/** Weather one-liner + scrolling news ticker + breaking-news card. */
export function BroadcastStrips({ data }: { data: BroadcastState }) {
  const { cfg, ticker, weather } = data;
  const Icon = weather ? weatherIcon(weather.code) : null;

  return (
    <div className="md:hidden px-4 mt-3 space-y-2.5">
      {cfg.breaking_active && cfg.breaking_headline && (
        <div className="flex items-stretch rounded-lg overflow-hidden">
          <div className="bg-vred px-2.5 flex items-center breaking-pulse flex-shrink-0">
            <span className="text-white text-[10px] font-black tracking-widest">BREAKING</span>
          </div>
          <div className="flex-1 min-w-0 bg-black/80 px-3 py-2">
            <div className="text-white font-black text-xs leading-tight">{cfg.breaking_headline}</div>
            {cfg.breaking_body && <div className="text-white/75 text-[11px] leading-snug mt-0.5">{cfg.breaking_body}</div>}
          </div>
        </div>
      )}

      {cfg.weather_enabled && weather && Icon && (
        <div className="flex items-center gap-2 rounded-lg glass px-3 h-9">
          <Icon size={15} className="text-vgold flex-shrink-0" />
          <span className="text-white text-sm font-black">{weather.tempC}°C</span>
          <span className="text-vmuted text-[11px] truncate">{weather.label} · {cfg.weather_city}</span>
          <span className="text-vmuted text-[11px] ml-auto flex-shrink-0">{weather.day}</span>
        </div>
      )}

      {cfg.ticker_enabled && <NewsTicker items={ticker} speed={cfg.ticker_speed} inline />}
    </div>
  );
}
