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
 *
 * HLS goes to hls.js wherever Media Source Extensions exist, and falls back to
 * a native `src` only where they do not (iOS Safari, which genuinely does play
 * a manifest by itself).
 *
 * This deliberately does NOT ask the element whether it can play HLS first.
 * That was the previous gate — `canPlayType('application/vnd.apple.mpegurl')`
 * guarding `!nativeHls` — and Chrome answers that MIME type with the truthy
 * string "maybe" while being entirely unable to decode a manifest. So on every
 * Chromium browser the check passed, hls.js was skipped, and a Bunny
 * playlist.m3u8 was assigned straight to video.src: the element parked in
 * networkState 2 / readyState 0 and never issued a single request for the
 * manifest. Nothing downstream could rescue that — no play() call, no autoplay
 * — which is why the Feed produced zero requests to the CDN.
 *
 * Hls.isSupported() is the honest question: it tests for MSE, which is what
 * hls.js actually needs.
 */
export function attachVideo(video: HTMLVideoElement, url: string): () => void {
  const kind = detectVideoKind(url);

  if (kind === 'hls') {
    let destroyed = false;
    let hls: { destroy: () => void } | null = null;
    let nativeSrc = false;
    import('hls.js').then(({ default: Hls }) => {
      if (destroyed) return;
      if (Hls.isSupported()) {
        const instance = new Hls({ enableWorker: true });
        instance.loadSource(url);
        instance.attachMedia(video);
        hls = instance;
      } else {
        // No MSE — iOS Safari, where native HLS is real rather than "maybe".
        video.src = url;
        nativeSrc = true;
      }
    });
    return () => {
      destroyed = true;
      hls?.destroy();
      if (nativeSrc) { video.removeAttribute('src'); video.load(); }
    };
  }

  // mp4, or anything else we hand straight to the element.
  video.src = url;
  return () => { video.removeAttribute('src'); video.load(); };
}
