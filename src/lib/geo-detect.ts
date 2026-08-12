/**
 * Viewer district detection for geo-targeted ads + weather.
 * Order: cached preference → IP geolocation (ip-api.com, free, no key) →
 * default 'Chennai'. Result cached in localStorage. Never throws.
 */
import { tamilNaduDistricts } from '@/data/mockData';

const CACHE_KEY = 'vallavan_district';
const DEFAULT_DISTRICT = 'Chennai';

/** Manually set / override the viewer's district (from a picker). */
export function setDistrict(district: string): void {
  try { localStorage.setItem(CACHE_KEY, district); } catch { /* ignore */ }
}

export function getCachedDistrict(): string | null {
  try { return localStorage.getItem(CACHE_KEY); } catch { return null; }
}

/** Map an arbitrary region/city string to the nearest known TN district. */
function normalizeToDistrict(city?: string, region?: string): string | null {
  const hay = `${city ?? ''} ${region ?? ''}`.toLowerCase();
  if (!hay.trim()) return null;
  const match = tamilNaduDistricts.find((d) => hay.includes(d.toLowerCase()));
  return match ?? null;
}

/**
 * Resolve the viewer's district. Returns a TN district name.
 * Uses cache first, then a best-effort IP lookup, then the default.
 */
export async function detectDistrict(): Promise<string> {
  const cached = getCachedDistrict();
  if (cached) return cached;

  try {
    const res = await fetch('https://ip-api.com/json/?fields=status,city,regionName', {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const district = normalizeToDistrict(data.city, data.regionName);
        if (district) { setDistrict(district); return district; }
      }
    }
  } catch { /* offline / blocked / timeout — fall through */ }

  return DEFAULT_DISTRICT;
}
