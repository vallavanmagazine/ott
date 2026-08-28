/**
 * Client-side schedule helpers for the Live TV experience (Phase 9/11).
 * The authoritative playout runs server-side (playout/); this mirrors the
 * "what's on now / next" logic so the browser can drive fallback playback and
 * the lower-third overlay when no HLS stream is present.
 */
import type { LiveSlot } from '@/data/mockData';

/** Parse "18:30" → minutes since midnight. */
function toMinutes(time24: string): number {
  const [h, m] = time24.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function slotMinutes(slot: LiveSlot): number {
  return toMinutes(slot.time24);
}

function durationMinutes(slot: LiveSlot): number {
  const m = slot.duration.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 30;
}

/** Trailing fraction of a program during which the "Coming Up Next" card is cued. */
const NEAR_END_FRACTION = 0.9;

export interface ProgramNow {
  current: LiveSlot | null;
  next: LiveSlot | null;
  /** 0..1 progress through the current program; 0 when nothing is on air. */
  progress: number;
  /**
   * True only while `current` is genuinely on air — i.e. the wall clock sits
   * inside its slot. False during schedule gaps, when `current` is a stale
   * fallback rather than a program actually playing.
   */
  onAir: boolean;
  /** True while on air AND inside the closing stretch of the program. */
  nearEnd: boolean;
}

/** Is the wall clock inside this slot's scheduled window? */
function isOnAir(slot: LiveSlot, nowMin: number): boolean {
  const start = slotMinutes(slot);
  return nowMin >= start && nowMin < start + durationMinutes(slot);
}

/** Determine the current + next program for a given time (default: now). */
export function getCurrentProgram(schedule: LiveSlot[], at: Date = new Date()): ProgramNow {
  if (schedule.length === 0) return { current: null, next: null, progress: 0, onAir: false, nearEnd: false };
  const sorted = [...schedule].sort((a, b) => slotMinutes(a) - slotMinutes(b));
  const nowMin = at.getHours() * 60 + at.getMinutes();

  // `isLive` is an editorial marker set by admin/playout, NOT a clock. Honour it
  // only while its slot is actually on air: a flag left set after the program
  // ended used to pin the overlay — and the "Coming Up Next" card — to a slot
  // that finished hours ago.
  const flagged = sorted.find((s) => s.isLive) ?? null;
  const onAirSlot =
    (flagged && isOnAir(flagged, nowMin) ? flagged : null)
    ?? sorted.find((s) => isOnAir(s, nowMin))
    ?? null;

  // Nothing scheduled for this minute: keep naming the flagged program so the
  // channel still identifies itself through a gap, but report onAir = false so
  // timers and transition cards stay silent.
  const current = onAirSlot ?? flagged;

  const curIdx = current ? sorted.findIndex((s) => s.id === current.id) : -1;
  const next = curIdx >= 0 && curIdx < sorted.length - 1
    ? sorted[curIdx + 1]
    : sorted.find((s) => slotMinutes(s) > nowMin) ?? null;

  let progress = 0;
  let nearEnd = false;
  if (onAirSlot) {
    const start = slotMinutes(onAirSlot);
    const dur = durationMinutes(onAirSlot) || 1;
    // `isOnAir` guarantees 0 <= raw < 1, so nearEnd can no longer latch on.
    const raw = (nowMin - start) / dur;
    progress = Math.max(0, Math.min(1, raw));
    nearEnd = raw >= NEAR_END_FRACTION;
  }

  return { current, next, progress, onAir: !!onAirSlot, nearEnd };
}

/**
 * Auto-adjust: when a program's actual duration differs from its slot, report
 * the downstream shift (positive = later, negative = earlier). Used to log
 * schedule drift; the server playout applies the real correction.
 */
export function scheduleDriftMinutes(slotDurationMin: number, actualDurationMin: number): number {
  return actualDurationMin - slotDurationMin;
}
