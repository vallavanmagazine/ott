/**
 * DyneTube video hosting/streaming. Docs: https://www.dyntube.com/dev
 *
 * SECURITY NOTE: per the dispatch, browser upload uses VITE_DYNETUBE_API_KEY,
 * which is exposed in the client bundle. Prefer routing uploads through the
 * NestJS backend (DYNETUBE_API_KEY, server-side) for production. Field names
 * below follow the documented endpoints; adjust if the live API differs.
 */
const API_BASE = (import.meta.env.VITE_DYNETUBE_API_BASE as string) || 'https://api.dyntube.com/v1';
const API_KEY = (import.meta.env.VITE_DYNETUBE_API_KEY as string) || '';

export const hasDyneTube = () => API_KEY.length > 0;

export interface DyneVideo {
  id: string;
  status: string;          // 'processing' | 'ready' | ...
  hlsUrl: string;          // .m3u8 playback URL
  playerUrl: string;       // embeddable player URL
}

/** Best-effort extraction of ids/URLs from varying response shapes. */
function normalize(json: any): DyneVideo {
  const id = json.id ?? json.videoId ?? json.data?.id ?? '';
  const hlsUrl = json.hlsUrl ?? json.m3u8 ?? json.playbackUrl ?? json.url ?? json.data?.hlsUrl ?? (id ? `https://player.dyntube.com/play/${id}.m3u8` : '');
  const playerUrl = json.playerUrl ?? json.embedUrl ?? (id ? `https://player.dyntube.com/play/${id}` : '');
  return { id, status: json.status ?? json.data?.status ?? 'processing', hlsUrl, playerUrl };
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${API_KEY}`, 'X-API-Key': API_KEY };
}

/** Upload a video file with progress. Returns the DyneTube video (id + HLS URL). */
export function uploadVideo(file: File, onProgress?: (pct: number) => void): Promise<DyneVideo> {
  return new Promise((resolve, reject) => {
    if (!hasDyneTube()) { reject(new Error('DyneTube not configured (set VITE_DYNETUBE_API_KEY).')); return; }
    const form = new FormData();
    form.append('file', file);
    form.append('title', file.name);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/videos`);
    xhr.setRequestHeader('Authorization', `Bearer ${API_KEY}`);
    xhr.setRequestHeader('X-API-Key', API_KEY);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(normalize(JSON.parse(xhr.responseText || '{}'))); }
        catch { reject(new Error('DyneTube: could not parse upload response')); }
      } else {
        reject(new Error(`DyneTube upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('DyneTube upload network error'));
    xhr.send(form);
  });
}

export async function getVideo(id: string): Promise<DyneVideo> {
  const res = await fetch(`${API_BASE}/videos/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`DyneTube get failed: ${res.status}`);
  return normalize(await res.json());
}

export async function listVideos(): Promise<DyneVideo[]> {
  const res = await fetch(`${API_BASE}/videos`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`DyneTube list failed: ${res.status}`);
  const json = await res.json();
  const arr = Array.isArray(json) ? json : (json.data ?? json.videos ?? []);
  return arr.map(normalize);
}

export async function deleteVideo(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/videos/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) throw new Error(`DyneTube delete failed: ${res.status}`);
}

/** Create a live stream (future playout). Returns stream key + HLS URL. */
export async function createLiveStream(name: string): Promise<{ id: string; streamKey: string; hlsUrl: string }> {
  const res = await fetch(`${API_BASE}/live/streams`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error(`DyneTube live create failed: ${res.status}`);
  const j = await res.json();
  return { id: j.id ?? j.streamId ?? '', streamKey: j.streamKey ?? j.key ?? '', hlsUrl: j.hlsUrl ?? j.playbackUrl ?? '' };
}
