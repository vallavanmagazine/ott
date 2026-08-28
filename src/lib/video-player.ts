/**
 * Lightweight video source handling: native <video> for mp4, hls.js for HLS
 * (.m3u8), YouTube via iframe. Chosen over Video.js for a smaller, TS-clean
 * footprint (architecture decision — see PROJECT_STATE Phase 4).
 */
import { youTubeId } from '@/lib/video';

export type VideoKind = 'mp4' | 'hls' | 'youtube' | 'none';

export function detectVideoKind(url?: string | null): VideoKind {
  if (!url) return 'none';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/\.m3u8(\?|$)/i.test(url)) return 'hls';
  return 'mp4';
}

/**
 * Build an autoplay embed URL for any YouTube link.
 *
 * Playback-time fallback for rows saved before the admin forms normalised
 * URLs on write: a /shorts/ or /live/ link stored raw would otherwise be
 * iframed as-is, and YouTube refuses to frame those (X-Frame-Options), giving
 * a blank player. Shares youTubeId() with the admin write path so both accept
 * exactly the same set of URL shapes.
 */
export function youtubeEmbedUrl(url: string): string {
  const id = youTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&playsinline=1` : url;
}

/**
 * Attach an HLS or direct source to a <video>. Returns a cleanup fn.
 * Safari plays HLS natively; other browsers lazy-load hls.js (code-split so
 * it never weighs down the main bundle — only fetched when HLS is needed).
 */
export function attachVideo(video: HTMLVideoElement, url: string): () => void {
  const kind = detectVideoKind(url);
  const nativeHls = video.canPlayType('application/vnd.apple.mpegurl');

  if (kind === 'hls' && !nativeHls) {
    let destroyed = false;
    let hls: { destroy: () => void } | null = null;
    import('hls.js').then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        const instance = new Hls({ enableWorker: true });
        instance.loadSource(url);
        instance.attachMedia(video);
        hls = instance;
      } else {
        video.src = url;
      }
    });
    return () => { destroyed = true; hls?.destroy(); };
  }

  // mp4, or HLS on Safari, or fallback
  video.src = url;
  return () => { video.removeAttribute('src'); video.load(); };
}
