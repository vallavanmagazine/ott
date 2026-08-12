import { supabase } from './supabase';
import { FfmpegEngine } from './ffmpeg-engine';
import { writePlaylist, resolveLocal, type PlayItem } from './playlist-builder';
import { getBreakAds } from './ad-inserter';
import { getFillerContent } from './filler';
import { computeDrift, logDrift } from './schedule-adjuster';

function toMinutes(t: string) { const [h, m] = t.split(':').map(Number); return (h || 0) * 60 + (m || 0); }

/**
 * Reads today's live_slots, determines what plays NOW, builds a concat playlist
 * (program + between-program ad break, or filler when nothing scheduled) and
 * (re)starts FFmpeg. Re-evaluates every minute.
 */
export function startScheduler(): FfmpegEngine {
  const engine = new FfmpegEngine();

  const tick = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: slots } = await supabase
        .from('live_slots').select('*').eq('air_date', today).order('sort_order');

      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      const current = (slots ?? []).find((s: any) => {
        const start = toMinutes(s.start_time24);
        return nowMin >= start && nowMin < start + (s.duration_min ?? 30);
      });

      const items: PlayItem[] = [];
      if (current && resolveLocal(current.video_url)) {
        items.push({ file: current.video_url, kind: 'program' });
        const breakAds = await getBreakAds(current.break_after_sec ?? 60);
        items.push(...breakAds);
        // record any drift for downstream slots
        void computeDrift(current.duration_min ?? 30, current.duration_min ?? 30);
        void logDrift;
      } else {
        items.push(...(await getFillerContent()));
      }

      if (items.length) {
        const playlist = writePlaylist(items);
        // Only restart if the playlist actually changed.
        if (playlist !== engine.playlist) engine.start(playlist);
      }
    } catch (e) {
      console.error('[scheduler] tick error', e);
    }
  };

  tick();
  setInterval(tick, 60_000);
  return engine;
}
