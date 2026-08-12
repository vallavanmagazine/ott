import { supabase } from './supabase';

/**
 * Timing reconciliation between a slot's planned duration and the program's
 * actual runtime.
 *   drift < 0 → program shorter → fill remainder with promo/ad (see filler).
 *   drift > 0 → program longer  → push subsequent slots forward, log it.
 */
export function computeDrift(slotDurationMin: number, actualDurationMin: number): number {
  return actualDurationMin - slotDurationMin;
}

export async function logDrift(slotId: string, driftMin: number) {
  await supabase.from('audit_logs').insert({
    actor: 'playout',
    action: `Schedule drift ${driftMin > 0 ? '+' : ''}${driftMin}m on slot ${slotId}`,
  });
}
