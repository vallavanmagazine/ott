/** Local viewer preferences: language, notifications, district. */
import { setDistrict } from '@/lib/geo-detect';

export interface Prefs {
  language: 'en' | 'ta';
  notifications: boolean;
  district: string;
}

const KEY = 'vallavan_prefs';
const DEFAULTS: Prefs = { language: 'en', notifications: true, district: 'Chennai' };

export function getPrefs(): Prefs {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return DEFAULTS; }
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  const next = { ...getPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  // Keep the ad/weather district in sync with the geo-detect cache.
  if (patch.district) setDistrict(patch.district);
  return next;
}
