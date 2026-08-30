/**
 * Feed engagement counters.
 *
 * feed_reels.likes / .shares have existed as int columns since the first
 * schema, but nothing ever wrote to them — the numbers on screen were whatever
 * the seed happened to put there. These calls make them real.
 *
 * The write goes through the bump_feed_metric() RPC rather than a direct
 * UPDATE, because feed_reels is admin-write under RLS and an anonymous viewer
 * is (correctly) refused. See supabase/feed_metrics_rpc.sql for the function
 * and the reasoning about why it is safe to expose.
 *
 * Returns the counter's new value so the caller can settle on what the database
 * actually holds instead of trusting its own optimistic arithmetic — two
 * viewers liking at once would otherwise each show their own count.
 */
import { supabase } from '@/lib/supabase';

export type FeedMetric = 'likes' | 'shares';

export async function bumpFeedMetric(
  id: string,
  metric: FeedMetric,
  delta: 1 | -1,
): Promise<number> {
  if (!supabase) throw new Error('Supabase is not configured in this build.');

  const { data, error } = await supabase.rpc('bump_feed_metric', {
    p_id: id,
    p_metric: metric,
    p_delta: delta,
  });

  if (error) {
    // PGRST202 = the function is not in the schema cache, i.e.
    // supabase/feed_metrics_rpc.sql has not been applied to this project yet.
    const hint = error.code === 'PGRST202'
      ? ' — run supabase/feed_metrics_rpc.sql against this project.'
      : '';
    throw new Error(`Could not record ${metric}: ${error.message}${hint}`);
  }

  return Number(data);
}
