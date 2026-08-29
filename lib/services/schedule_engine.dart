/// Resolves which Live TV programme is on air, from the schedule and the clock.
///
/// Port of the web app's `services/schedule-engine.ts`. Both clients render the
/// same channel from the same `live_slots` rows, so "what is playing right now"
/// must be answered identically — otherwise the phone and the web site disagree
/// about the channel at the same instant.
///
/// The rule this encodes: `is_live` is an EDITORIAL marker set by admin/playout,
/// not a clock. Honoured only while its slot is genuinely on air; otherwise the
/// current programme is resolved by wall clock. A flag left set after a slot
/// ended used to pin "NOW PLAYING" to a programme that finished hours ago.
library;

import '../models/live_slot.dart';

/// Trailing fraction of a programme during which it counts as closing.
const double kNearEndFraction = 0.9;

/// Minutes past midnight for a slot's `HH:MM` start time.
///
/// Ordering must key on the start time, not the `sort_order` column: sort_order
/// is an admin display ordering and does not have to be chronological.
int slotMinutes(LiveSlot s) {
  final parts = s.startTime24.split(':');
  final h = int.tryParse(parts.isNotEmpty ? parts[0] : '') ?? 0;
  final m = int.tryParse(parts.length > 1 ? parts[1] : '') ?? 0;
  return h * 60 + m;
}

/// Is the wall clock inside this slot's scheduled window?
bool isOnAir(LiveSlot s, int nowMin) {
  final start = slotMinutes(s);
  return nowMin >= start && nowMin < start + (s.durationMin > 0 ? s.durationMin : 30);
}

class ProgramNow {
  /// The programme to name on screen. During a schedule gap this is the
  /// flagged slot — the channel still identifies itself — even though nothing
  /// is actually playing, so always check [onAir] before showing it as live.
  final LiveSlot? current;
  final LiveSlot? next;

  /// 0..1 through [current]; 0 when nothing is on air.
  final double progress;

  /// True only while [current] is genuinely on air, i.e. the wall clock sits
  /// inside its slot. False through schedule gaps.
  final bool onAir;

  /// True while on air AND inside the closing stretch of the programme.
  final bool nearEnd;

  const ProgramNow({
    this.current,
    this.next,
    this.progress = 0,
    this.onAir = false,
    this.nearEnd = false,
  });

  static const empty = ProgramNow();
}

/// The current + next programme for a given time (default: now).
ProgramNow getCurrentProgram(List<LiveSlot> schedule, {DateTime? at}) {
  if (schedule.isEmpty) return ProgramNow.empty;
  final now = at ?? DateTime.now();
  final nowMin = now.hour * 60 + now.minute;

  final sorted = [...schedule]..sort((a, b) => slotMinutes(a).compareTo(slotMinutes(b)));

  LiveSlot? flagged;
  for (final s in sorted) {
    if (s.isLive) { flagged = s; break; }
  }

  // Honour the editorial flag only while that slot is actually on air; then
  // fall back to whichever slot the clock is inside.
  LiveSlot? onAirSlot;
  if (flagged != null && isOnAir(flagged, nowMin)) {
    onAirSlot = flagged;
  } else {
    for (final s in sorted) {
      if (isOnAir(s, nowMin)) { onAirSlot = s; break; }
    }
  }

  // Nothing scheduled for this minute: keep naming the flagged programme so the
  // channel still identifies itself through a gap, but report onAir = false so
  // the "NOW PLAYING" treatment stays off.
  final current = onAirSlot ?? flagged;

  final curIdx = current == null ? -1 : sorted.indexWhere((s) => s.id == current.id);
  LiveSlot? next;
  if (curIdx >= 0 && curIdx < sorted.length - 1) {
    next = sorted[curIdx + 1];
  } else {
    for (final s in sorted) {
      if (slotMinutes(s) > nowMin) { next = s; break; }
    }
  }

  double progress = 0;
  bool nearEnd = false;
  if (onAirSlot != null) {
    final start = slotMinutes(onAirSlot);
    final dur = onAirSlot.durationMin > 0 ? onAirSlot.durationMin : 1;
    // isOnAir guarantees 0 <= raw < 1, so nearEnd is bounded by construction
    // and closes on its own when the programme ends — it cannot latch on.
    final raw = (nowMin - start) / dur;
    progress = raw.clamp(0.0, 1.0);
    nearEnd = raw >= kNearEndFraction;
  }

  return ProgramNow(
    current: current,
    next: next,
    progress: progress,
    onAir: onAirSlot != null,
    nearEnd: nearEnd,
  );
}
