/**
 * Video URL helpers for the admin CMS.
 *
 * Feed/Live/Documentary forms accept four kinds of source URL:
 *   - YouTube (watch / youtu.be / shorts / embed)
 *   - DyneTube (uploaded via the DyneTube API — returns a direct URL)
 *   - HLS (.m3u8) for the live playout channel
 *   - plain MP4
 * Only YouTube exposes a derivable thumbnail, so that is the one case where the
 * form can auto-fill the thumbnail field. Everything else needs a manual URL.
 */

export type VideoKind = 'youtube' | 'hls' | 'mp4' | 'dynetube' | 'unknown';

/** Extract the 11-char YouTube video id from any common YouTube URL form. */
export function youTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function classifyVideoUrl(url: string): VideoKind {
  if (!url) return 'unknown';
  if (youTubeId(url)) return 'youtube';
  if (/\.m3u8(\?|$)/i.test(url)) return 'hls';
  if (/\.mp4(\?|$)/i.test(url)) return 'mp4';
  if (/dynetube/i.test(url)) return 'dynetube';
  return 'unknown';
}

/**
 * Thumbnail derivable from the video URL, or null when the source does not
 * expose one. `hqdefault` always exists; `maxresdefault` does not for every
 * upload, so we deliberately use the safe one.
 */
export function autoThumbnail(url: string): string | null {
  const id = youTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Human label for the detected source, shown next to the URL field. */
export function videoKindLabel(url: string): string {
  switch (classifyVideoUrl(url)) {
    case 'youtube': return 'YouTube';
    case 'hls': return 'HLS stream';
    case 'mp4': return 'MP4 file';
    case 'dynetube': return 'DyneTube';
    default: return url ? 'Custom URL' : '';
  }
}

/** "0:45" / "12:30" from a whole number of seconds. */
export function secondsToClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}
