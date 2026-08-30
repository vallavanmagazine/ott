/// Synthetic view floor for freshly published Feed content — DISPLAY ONLY.
///
/// A direct port of the web SPA's `src/lib/view-ramp.ts`. The hash, the PRNG
/// and the constants are identical on purpose: both platforms must show the
/// same number for the same reel at the same moment, and the only way to
/// guarantee that without a shared server call is to make the arithmetic
/// bit-for-bit reproducible. If you retune the constants, change them in BOTH
/// files or the two apps will disagree.
///
/// Nothing is written to the database. The stored `views` column keeps its true
/// value for the admin dashboards; this is a read-time floor.
library;

/// Tunable. Change these to re-pace the climb — nothing else needs editing.
///
/// At the defaults a reel reaches roughly 30-150 + (2880 x ~3.5) ~= 10,000
/// views across the 48-hour window, then stops growing.
const int kMinViewsPerMinute = 2;
const int kMaxViewsPerMinute = 5;

/// How long the climb runs before it freezes. 2880 minutes = 48 hours.
const int kRampMinutes = 2880;

/// Range for a reel's one-off starting number when the column is unset.
const int kSeedViewsMin = 30;
const int kSeedViewsMax = 150;

const int _mask32 = 0xFFFFFFFF;

/// JS `Math.imul` — a 32-bit multiply that wraps rather than promoting to
/// double. Dart ints are 64-bit, so the product is masked back down.
int _imul(int a, int b) {
  final aLo = a & 0xFFFF;
  final aHi = (a >> 16) & 0xFFFF;
  final bLo = b & 0xFFFF;
  final bHi = (b >> 16) & 0xFFFF;
  return (aLo * bLo + (((aHi * bLo + aLo * bHi) & 0xFFFF) << 16)) & _mask32;
}

/// FNV-1a over UTF-16 code units, matching the TS `hash32`.
int _hash32(String s) {
  var h = 2166136261 & _mask32;
  for (var i = 0; i < s.length; i++) {
    h = (h ^ s.codeUnitAt(i)) & _mask32;
    h = _imul(h, 16777619);
  }
  return h;
}

/// mulberry32, matching the TS generator draw for draw.
double Function() _mulberry32(int seed) {
  var a = seed & _mask32;
  return () {
    a = (a + 0x6D2B79F5) & _mask32;
    var t = _imul(a ^ (a >> 15), 1 | a);
    t = ((t + _imul(t ^ (t >> 7), 61 | t)) & _mask32) ^ t;
    t &= _mask32;
    return ((t ^ (t >> 14)) & _mask32) / 4294967296.0;
  };
}

/// A reel's starting number when `initial_seed_views` is not set — decided by
/// the row's own id, so it is stable without needing to be stored.
int seedViewsFor(String id) {
  const span = kSeedViewsMax - kSeedViewsMin + 1;
  return kSeedViewsMin + (_hash32('seed:$id') % span);
}

/// The synthetic figure alone, frozen once [kRampMinutes] have elapsed.
int syntheticViews(
  String id,
  DateTime? publishedAt, {
  int? initialSeedViews,
  DateTime? now,
}) {
  if (publishedAt == null) return 0;
  final at = now ?? DateTime.now();
  final elapsed = at.difference(publishedAt).inMinutes;
  final minutes = elapsed < 0 ? 0 : (elapsed > kRampMinutes ? kRampMinutes : elapsed);

  final rand = _mulberry32(_hash32(id));
  const span = kMaxViewsPerMinute - kMinViewsPerMinute + 1;
  var total = initialSeedViews ?? seedViewsFor(id);
  for (var i = 0; i < minutes; i++) {
    total += kMinViewsPerMinute + (rand() * span).floor();
  }
  return total;
}

/// What a viewer sees: the real count, or the synthetic floor when it is
/// higher. A floor, never an addend — real traffic overtaking it must not be
/// inflated by it.
int displayViews({
  required String id,
  DateTime? publishedAt,
  int? initialSeedViews,
  int realViews = 0,
  DateTime? now,
}) {
  final real = realViews < 0 ? 0 : realViews;
  final floor = syntheticViews(id, publishedAt,
      initialSeedViews: initialSeedViews, now: now);
  return real > floor ? real : floor;
}
