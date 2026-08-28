import type { BroadcastState } from '@/hooks/useBroadcast';
import { ChannelBug } from './ChannelBug';
import { LowerThird } from './LowerThird';
import { NewsTicker } from './NewsTicker';
import { LBand } from './LBand';
import { BreakingNews } from './BreakingNews';
import { ComingUpNext } from './ComingUpNext';
import { ProgramTimer } from './ProgramTimer';
import { WeatherWidget } from './WeatherWidget';
import { PoweredBy } from './PoweredBy';

/**
 * Broadcast graphics layer drawn ON TOP of the Live TV video.
 *
 * Mobile (< 768px) deliberately keeps the video clean: only the compact channel
 * bug rides on the picture. Everything else (now/next, weather, ticker, breaking
 * news) is stacked BELOW the video by `<BroadcastPanels>` so nothing overlaps on
 * a small screen. From `md:` up, the full broadcast overlay returns.
 *
 * State is passed in — see `useBroadcast`, which must be mounted exactly once.
 */
export function BroadcastOverlay({ data }: { data: BroadcastState }) {
  const { cfg, ticker, weather, current, next, progress, onAir, nearEnd, lbandName, poweredName } = data;

  return (
    <>
      {/* Mobile: logo bug only. */}
      {cfg.logo_enabled && (
        <ChannelBug position="top-right" opacity={cfg.logo_opacity} compact className="md:hidden z-20" />
      )}

      {/* Desktop / tablet: the full graphics layer. */}
      <div className="hidden md:block absolute inset-0 z-20 pointer-events-none">
        {cfg.powered_by_enabled && <PoweredBy sponsorName={poweredName} />}
        {cfg.logo_enabled && <ChannelBug position={cfg.logo_position} opacity={cfg.logo_opacity} />}
        {cfg.weather_enabled && <WeatherWidget weather={weather} city={cfg.weather_city} belowPoweredBy={cfg.powered_by_enabled} />}
        <ProgramTimer current={current} progress={progress} onAir={onAir} />
        {cfg.lband_enabled && <LBand sponsorName={lbandName} position={cfg.lband_position} />}
        {cfg.lower_third_enabled && !cfg.breaking_active && <LowerThird current={current} next={next} />}
        {cfg.breaking_active && <BreakingNews headline={cfg.breaking_headline} body={cfg.breaking_body} />}
        {nearEnd && !cfg.breaking_active && <ComingUpNext next={next} />}
        {cfg.ticker_enabled && <NewsTicker items={ticker} speed={cfg.ticker_speed} />}
      </div>
    </>
  );
}
