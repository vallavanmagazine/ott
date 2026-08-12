import { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';
import { fetchWeather, type Weather } from '@/services/weather';

function icon(code: number) {
  if (code === 0) return Sun;
  if (code <= 48) return Cloud;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77) return CloudSnow;
  return CloudLightning;
}

/** Corner weather widget for the broadcast overlay. */
export function WeatherWidget({ city = 'Chennai' }: { city?: string }) {
  const [w, setW] = useState<Weather | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => fetchWeather(city).then((res) => { if (active) setW(res); });
    load();
    const t = setInterval(load, 30 * 60 * 1000);
    return () => { active = false; clearInterval(t); };
  }, [city]);

  if (!w) return null;
  const Icon = icon(w.code);
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-2 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5">
        <Icon size={16} className="text-vgold" />
        <span className="text-white text-sm font-black">{w.tempC}°C</span>
        <span className="text-vmuted text-[10px]">{w.label} · {w.day} · {city}</span>
      </div>
    </div>
  );
}
