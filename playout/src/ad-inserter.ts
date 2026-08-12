import { supabase } from './supabase';
import type { PlayItem } from './playlist-builder';

/**
 * Picks ad clips for a between-program break from Active campaigns. Ads must have
 * a local video (ad video_url) to be inserted into the HLS concat stream.
 */
export async function getBreakAds(maxSeconds: number): Promise<PlayItem[]> {
  const { data: camps } = await supabase.from('campaigns').select('id').eq('status', 'Active');
  const ids = (camps ?? []).map((c: any) => c.id);
  if (!ids.length) return [];
  const { data: ads } = await supabase.from('ads').select('bg_image, headline').in('campaign_id', ids).limit(5);
  // NOTE: image creatives can't concat into video; a real deployment uses an ad
  // video field. Kept minimal — returns [] until ad videos exist.
  void ads; void maxSeconds;
  return [];
}
