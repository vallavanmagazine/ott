import { useEffect, useState } from 'react';
import type { LiveSlot } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import {
  fetchBroadcastConfig, subscribeBroadcastConfig,
  DEFAULT_BROADCAST_CONFIG, type BroadcastConfig,
} from '@/services/broadcast';
import { fetchTickerItems, subscribeTicker, type TickerItem } from '@/services/ticker';
import { getCurrentProgram } from '@/services/schedule-engine';
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
 * Full broadcast graphics layer, rendered on top of the Live TV video.
 * Everything is driven by broadcast_config + ticker_items via Supabase Realtime,
 * so admin changes reflect instantly for all viewers.
 */
export function BroadcastOverlay({ schedule }: { schedule: LiveSlot[] }) {
  const [cfg, setCfg] = useState<BroadcastConfig>(DEFAULT_BROADCAST_CONFIG);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [sponsors, setSponsors] = useState<Record<string, string>>({});
  const [, force] = useState(0);

  useEffect(() => {
    fetchBroadcastConfig().then(setCfg);
    fetchTickerItems().then(setTicker);
    const unsubCfg = subscribeBroadcastConfig(setCfg);
    const unsubTick = subscribeTicker(() => fetchTickerItems().then(setTicker));
    // Resolve sponsor names for L-band / Powered-by strips.
    if (supabase) supabase.from('sponsors').select('id, name').then(({ data }) => {
      if (data) setSponsors(Object.fromEntries(data.map((s: any) => [s.id, s.name])));
    });
    // Re-evaluate current/next program each minute.
    const tick = setInterval(() => force((n) => n + 1), 60_000);
    return () => { unsubCfg(); unsubTick(); clearInterval(tick); };
  }, []);

  const { current, next, progress } = getCurrentProgram(schedule);
  const nearEnd = progress > 0.9;
  const lbandName = (cfg.lband_sponsor_id && sponsors[cfg.lband_sponsor_id]) || 'Sponsor';
  const poweredName = (cfg.powered_by_sponsor_id && sponsors[cfg.powered_by_sponsor_id]) || 'Sponsor';

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {cfg.powered_by_enabled && <PoweredBy sponsorName={poweredName} />}
      {cfg.logo_enabled && <ChannelBug position={cfg.logo_position} opacity={cfg.logo_opacity} />}
      {cfg.weather_enabled && <WeatherWidget city={cfg.weather_city} />}
      <ProgramTimer current={current} progress={progress} />
      {cfg.lband_enabled && <LBand sponsorName={lbandName} position={cfg.lband_position} />}
      {cfg.lower_third_enabled && !cfg.breaking_active && <LowerThird current={current} next={next} />}
      {cfg.breaking_active && <BreakingNews headline={cfg.breaking_headline} body={cfg.breaking_body} />}
      {nearEnd && !cfg.breaking_active && <ComingUpNext next={next} />}
      {cfg.ticker_enabled && <NewsTicker items={ticker} speed={cfg.ticker_speed} />}
    </div>
  );
}
