import { supabase } from './supabase';
import type { PlayItem } from './playlist-builder';

/**
 * Filler content for gaps / when nothing is scheduled: rotate best-of
 * documentaries (that have a local video_url) as a promo loop.
 */
export async function getFillerContent(): Promise<PlayItem[]> {
  const { data } = await supabase
    .from('documentaries')
    .select('video_url')
    .eq('status', 'Published')
    .not('video_url', 'is', null)
    .limit(10);
  return (data ?? [])
    .map((d: any) => d.video_url as string)
    .filter(Boolean)
    .map((file): PlayItem => ({ file, kind: 'filler' }));
}
