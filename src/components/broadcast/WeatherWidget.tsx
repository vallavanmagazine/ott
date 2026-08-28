import type { Weather } from '@/services/weather';
import { weatherIcon } from './weatherIcon';

/**
 * Corner weather widget for the broadcast overlay (desktop only).
 * Presentational — the reading is fetched once by `useBroadcast`.
 */
export function WeatherWidget({ weather, city = 'Chennai' }: { weather: Weather | null; city?: string }) {
  if (!weather) return null;
  const Icon = weatherIcon(weather.code);
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5">
        <Icon size={16} className="text-vgold" />
        <span className="text-white text-sm font-black">{weather.tempC}°C</span>
        <span className="text-vmuted text-[10px]">{weather.label} · {weather.day} · {city}</span>
      </div>
    </div>
  );
}
