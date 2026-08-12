import { FfmpegEngine } from './ffmpeg-engine';

/** Monitors the FFmpeg process; restarts it from its last playlist on crash. */
export function startHealthCheck(engine: FfmpegEngine) {
  setInterval(() => {
    if (!engine.running && engine.playlist) {
      console.warn('[health] ffmpeg down — restarting');
      engine.start(engine.playlist);
    }
  }, 15_000);
}
