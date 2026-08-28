import { useEffect, useState } from 'react';
import type { LiveSlot } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import {
  fetchBroadcastConfig, subscribeBroadcastConfig,
  DEFAULT_BROADCAST_CONFIG, type BroadcastConfig,
} from '@/services/broadcast';
import { fetchTickerItems, subscribeTicker, type TickerItem } from '@/services/ticker';
import { getCurrentProgram } from '@/services/schedule-engine';
import { fetchWeather, type Weather } from '@/services/weather';

export interface BroadcastState {
  cfg: BroadcastConfig;
  ticker: TickerItem[];
  weather: Weather | null;
  current: LiveSlot | null;
  next: LiveSlot | null;
  progress: number;
  /** True while the current program is genuinely playing (not a schedule-gap fallback). */
  onAir: boolean;
  /** True in the last 10% of the current program — cue the "Coming Up Next" card. */
  nearEnd: boolean;
  lbandName: string;
  poweredName: string;
}

/**
 * Single owner of all Live TV broadcast state (config, ticker, sponsors, weather,
 * now/next). Mount this ONCE per screen: the mobile stacked panels and the desktop
 * on-video overlay render the same state rather than each opening their own
 * Realtime channels — CSS-hidden components still mount and still run effects.
 */
export function useBroadcast(schedule: LiveSlot[]): BroadcastState {
  const [cfg, setCfg] = useState<BroadcastConfig>(DEFAULT_BROADCAST_CONFIG);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [sponsors, setSponsors] = useState<Record<string, string>>({});
  const [weather, setWeather] = useState<Weather | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    fetchBroadcastConfig().then(setCfg);
    fetchTickerItems().then(setTicker);
    const unsubCfg = subscribeBroadcastConfig(setCfg);
    const unsubTick = subscribeTicker(() => fetchTickerItems().then(setTicker));
    // Resolve sponsor names for L-band / Powered-by strips.
    if (supabase) supabase.from('sponsors').select('id, name').then(({ data }) => {
      const rows = (data ?? []) as { id: string; name: string }[];
      if (rows.length) setSponsors(Object.fromEntries(rows.map((s) => [s.id, s.name])));
    });
    // Re-evaluate current/next program each minute.
    const tick = setInterval(() => force((n) => n + 1), 60_000);
    return () => { unsubCfg(); unsubTick(); clearInterval(tick); };
  }, []);

  const city = cfg.weather_city;
  useEffect(() => {
    let active = true;
    const load = () => fetchWeather(city).then((res) => { if (active) setWeather(res); });
    load();
    const t = setInterval(load, 30 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, [city]);

  // nearEnd/onAir are derived by the schedule engine, which knows whether the
  // program is actually on air — deriving it from `progress` here latched the
  // "Coming Up Next" card on permanently once progress saturated at 1.
  const { current, next, progress, onAir, nearEnd } = getCurrentProgram(schedule);

  return {
    cfg,
    ticker,
    weather,
    current,
    next,
    progress,
    onAir,
    nearEnd,
    lbandName: (cfg.lband_sponsor_id && sponsors[cfg.lband_sponsor_id]) || 'Sponsor',
    poweredName: (cfg.powered_by_sponsor_id && sponsors[cfg.powered_by_sponsor_id]) || 'Sponsor',
  };
}
