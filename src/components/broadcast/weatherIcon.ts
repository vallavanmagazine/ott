import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

/**
 * Open-Meteo WMO weather code → lucide icon.
 * Kept out of the component files so both the desktop overlay widget and the
 * mobile weather strip can share it without breaking react-refresh.
 */
export function weatherIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 48) return Cloud;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77) return CloudSnow;
  return CloudLightning;
}
