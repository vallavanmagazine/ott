/**
 * Synthetic view floor for freshly published Feed content — VIEWER DISPLAY ONLY.
 *
 * A new reel showing "0 views" reads as dead content, so for its first 48 hours
 * the viewer sees a modest synthetic climb instead. After that the synthetic
 * part stops growing for good and whatever real view tracking exists takes over.
 *
 * Three properties this deliberately holds to:
 *
 *  1. NOTHING IS WRITTEN. This is computed at read time in services/feed.ts and
 *     applied only on the viewer path. feed_reels.views keeps its true stored
 *     value, so the admin dashboards that read it (admin-stats, admin-analytics)
 *     stay accurate, and no cron is needed.
 *
 *  2. IT IS A FLOOR, NOT AN ADDEND OR A CEILING. The displayed number is
 *     max(real, synthetic): while real views are behind, the floor carries the
 *     number; the moment real views overtake it — KSM expects 100,000+ — they
 *     drive it alone and the floor stops mattering. Adding the two instead
 *     would overstate genuine traffic, which is the one thing this must not do.
 *
 *  3. IT IS DETERMINISTIC. Growth is pseudo-random per reel and per minute, so
 *     it looks organic rather than linear, but the sequence is derived from the
 *     reel's id: the same reel yields the same number on every load, every
 *     device and every reload. That is why no "frozen value" ever needs storing
 *     at the 48-hour mark — clamping the elapsed minutes freezes it by
 *     construction, and it cannot drift between page loads to begin with.
 *
 * NOT touched here: likes, shares and comments. Those are real engagement,
 * moved only by a viewer's own tap through services/feed-metrics.ts.
 */

/**
 * Tunable. Change these to re-pace the climb — nothing else needs editing.
 *
 * At the defaults a reel reaches roughly 30-150 + (2880 x ~3.5) ≈ 10,000 views
 * over the 48-hour window before the synthetic part stops.
 */
export const VIEW_RAMP = {
  /** Slowest and fastest synthetic growth, in views per elapsed minute. */
  MIN_VIEWS_PER_MINUTE: 2,
  MAX_VIEWS_PER_MINUTE: 5,
  /** How long the climb runs before it freezes. 2880 minutes = 48 hours. */
  RAMP_MINUTES: 2880,
  /** Range for a reel's one-off starting number when the column is unset. */
  SEED_VIEWS_MIN: 30,
  SEED_VIEWS_MAX: 150,
} as const;

/** FNV-1a. Turns a reel id into a stable 32-bit seed. */
function hash32(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and identical in every browser, which is the point. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A reel's starting number, when feed_reels.initial_seed_views is not set.
 *
 * Derived from the id rather than drawn randomly, so it is decided once and for
 * all by the row itself — the column in supabase/feed_view_ramp.sql only makes
 * it explicit and editable, it is not required for any of this to work.
 */
export function seedViewsFor(id: string): number {
  const span = VIEW_RAMP.SEED_VIEWS_MAX - VIEW_RAMP.SEED_VIEWS_MIN + 1;
  return VIEW_RAMP.SEED_VIEWS_MIN + (hash32(`seed:${id}`) % span);
}

/** The synthetic figure on its own, frozen once RAMP_MINUTES have elapsed. */
export function syntheticViews(
  id: string,
  publishedAt: string | null | undefined,
  initialSeedViews?: number | null,
  now: number = Date.now(),
): number {
  const start = Date.parse(publishedAt ?? '');
  // No usable publish time means no idea how long to ramp for — so don't.
  if (!Number.isFinite(start)) return 0;

  const elapsed = Math.floor((now - start) / 60_000);
  const minutes = Math.max(0, Math.min(VIEW_RAMP.RAMP_MINUTES, elapsed));

  // One draw per elapsed minute, in order. Because the sequence is fixed per
  // reel, minute N's increment is always the same value — the total only ever
  // grows by appending later draws, it never recomputes differently.
  const rand = mulberry32(hash32(id));
  const span = VIEW_RAMP.MAX_VIEWS_PER_MINUTE - VIEW_RAMP.MIN_VIEWS_PER_MINUTE + 1;
  let total = initialSeedViews ?? seedViewsFor(id);
  for (let i = 0; i < minutes; i++) {
    total += VIEW_RAMP.MIN_VIEWS_PER_MINUTE + Math.floor(rand() * span);
  }
  return total;
}

/** What a viewer should see: the real count, or the synthetic floor if higher. */
export function displayViews(args: {
  id: string;
  publishedAt: string | null | undefined;
  initialSeedViews?: number | null;
  realViews?: number | null;
  now?: number;
}): number {
  const real = Math.max(0, args.realViews ?? 0);
  const floor = syntheticViews(args.id, args.publishedAt, args.initialSeedViews, args.now);
  return Math.max(real, floor);
}
