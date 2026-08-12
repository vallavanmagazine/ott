/**
 * Transform utilities: convert Supabase DB rows (snake_case) to
 * the exact TypeScript shapes defined in mockData.ts (camelCase).
 *
 * The pexels URL helper is re-exported from mockData so existing
 * components keep working unchanged.
 */

/** Convert duration_sec (integer seconds) to display string "24:18" */
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Convert duration_sec for short-form content: "0:45" */
export function formatShortDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Convert 24h time "18:00" to 12h display "06:00 PM" (live_slots.start_time24) */
export function format12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m} ${period}`;
}

/** Convert duration_min (integer minutes) to display string "30 min" (live_slots) */
export function formatMinutes(min: number): string {
  return `${min} min`;
}

/** Convert timestamptz to display string "Aug 10, 2024" */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

/** Convert timestamptz to short display "Aug 05, 14:32" */
export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month} ${day}, ${hours}:${mins}`;
}

/** Convert timestamptz to "Jan 2024" style */
export function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Format paise to rupee string "₹18,500" */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN')}`;
}
