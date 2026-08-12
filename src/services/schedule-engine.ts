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

export interface ProgramNow {
  current: LiveSlot | null;
  next: LiveSlot | null;
  /** 0..1 progress through the current program. */
  progress: number;
}

/** Determine the current + next program for a given time (default: now). */
export function getCurrentProgram(schedule: LiveSlot[], at: Date = new Date()): ProgramNow {
  if (schedule.length === 0) return { current: null, next: null, progress: 0 };
  const sorted = [...schedule].sort((a, b) => slotMinutes(a) - slotMinutes(b));
  const nowMin = at.getHours() * 60 + at.getMinutes();

  // Prefer the explicitly-flagged live slot if present
  const flagged = sorted.find((s) => s.isLive);

  let current: LiveSlot | null = flagged ?? null;
  if (!current) {
    for (const slot of sorted) {
      const start = slotMinutes(slot);
      const end = start + durationMinutes(slot);
      if (nowMin >= start && nowMin < end) { current = slot; break; }
    }
  }

  const curIdx = current ? sorted.findIndex((s) => s.id === current!.id) : -1;
  const next = curIdx >= 0 && curIdx < sorted.length - 1
    ? sorted[curIdx + 1]
    : sorted.find((s) => slotMinutes(s) > nowMin) ?? null;

  let progress = 0;
  if (current) {
    const start = slotMinutes(current);
    const dur = durationMinutes(current);
    progress = Math.max(0, Math.min(1, (nowMin - start) / dur));
  }

  return { current, next, progress };
}

/**
 * Auto-adjust: when a program's actual duration differs from its slot, report
 * the downstream shift (positive = later, negative = earlier). Used to log
 * schedule drift; the server playout applies the real correction.
 */
export function scheduleDriftMinutes(slotDurationMin: number, actualDurationMin: number): number {
  return actualDurationMin - slotDurationMin;
}
