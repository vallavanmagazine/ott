/**
 * Bunny Stream uploads, routed entirely through OUR backend.
 *
 * Every call here hits `/api/bunny/...` on the NestJS service — the Bunny API
 * key is never in the browser. The one request that goes straight to Bunny is
 * the TUS upload itself, and it is authorised by a short-lived signature the
 * backend mints per video (see backend/src/bunny/bunny.service.ts). That is the
 * deliberate difference from services/dynetube.ts, which ships
 * VITE_DYNETUBE_API_KEY inside the client bundle.
 *
 * Nothing here writes to the database. The widget hands values into form state
 * and the screen's existing Save button persists them, exactly like the
 * DyneTube flow — so an upload works identically whether the content row
 * already exists ("Edit") or does not yet ("Add").
 */
import { Upload } from 'tus-js-client';
import { API_BASE, apiGet, apiPost, hasBackend } from '@/lib/api';

export interface UploadTicket {
  videoGuid: string;
  tusEndpoint: string;
  tusHeaders: Record<string, string>;
  expiry: number;
}

export interface BunnyStatus {
  guid: string;
  status: string;
  ready: boolean;
  playbackUrl: string | null;
  thumbnailUrl: string | null;
}

/**
 * Thrown when the caller aborts an upload (the admin closed the editor, or the
 * widget unmounted). Distinct from a real failure so the UI can stay silent
 * instead of toasting an error the admin already knows about.
 */
export class UploadAborted extends Error {
  constructor() {
    super('Upload cancelled');
    this.name = 'UploadAborted';
  }
}

export const isAborted = (e: unknown): boolean => (e as Error)?.name === 'UploadAborted';

/** Mirrors hasDyneTube() — lets the button disable itself with a useful reason. */
export const hasBunny = () => hasBackend();

/**
 * Reserve a Bunny video and get TUS credentials for it.
 *
 * Only the title is sent: upload-init deliberately does not require a record id,
 * because uploads start from the "Add" modal before any row exists.
 */
export async function initUpload(title: string): Promise<UploadTicket> {
  if (!hasBunny()) throw new Error('Video backend not configured (set VITE_API_BASE_URL).');
  return apiPost<UploadTicket>('/api/bunny/upload-init', { title });
}

/**
 * Upload the file straight to Bunny over TUS, reporting 0-100 progress.
 *
 * tus-js-client performs the creation POST and the PATCH chunks; the signature
 * headers from initUpload authorise both. retryDelays give a dropped connection
 * a few chances before the whole upload is abandoned — large video files over a
 * flaky admin connection are the normal case, not the exception.
 */
export function uploadFile(
  file: File,
  tusEndpoint: string,
  tusHeaders: Record<string, string>,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new UploadAborted()); return; }

    const upload = new Upload(file, {
      endpoint: tusEndpoint,
      headers: tusHeaders,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: { filetype: file.type || 'video/mp4', title: file.name },
      onProgress: (sent, total) => {
        if (onProgress && total > 0) onProgress(Math.round((sent / total) * 100));
      },
      onSuccess: () => { signal?.removeEventListener('abort', onAbort); resolve(); },
      onError: (err) => {
        signal?.removeEventListener('abort', onAbort);
        // tus surfaces its own error for a cancelled request; report the abort.
        reject(signal?.aborted ? new UploadAborted() : new Error(err.message));
      },
    });

    function onAbort() {
      // Stop sending bytes immediately rather than waiting for the current
      // chunk to finish; the caller is already tearing the editor down.
      void upload.abort();
      reject(new UploadAborted());
    }
    signal?.addEventListener('abort', onAbort, { once: true });

    upload.start();
  });
}

export async function getStatus(videoGuid: string): Promise<BunnyStatus> {
  return apiGet<BunnyStatus>(`/api/bunny/videos/${videoGuid}/status`);
}

/** setTimeout that resolves early when the caller aborts, so cancel feels instant. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => { clearTimeout(t); signal?.removeEventListener('abort', done); resolve(); };
    const t = setTimeout(done, ms);
    signal?.addEventListener('abort', done, { once: true });
  });
}

/**
 * Wait for Bunny to finish transcoding.
 *
 * Bunny reports encodeProgress/storageSize as 0 for the whole processing window
 * and only fills them in at the end, so `ready` is the single trustworthy
 * signal. A short clip has been observed taking ~9 minutes, hence the 15-minute
 * ceiling rather than something tighter.
 */
export async function pollStatus(
  videoGuid: string,
  onTick?: (status: string) => void,
  signal?: AbortSignal,
): Promise<{ playbackUrl: string; thumbnailUrl: string | null }> {
  const intervalMs = 5000;
  const attempts = (15 * 60 * 1000) / intervalMs; // 15 minutes

  for (let i = 0; i < attempts; i++) {
    if (signal?.aborted) throw new UploadAborted();
    const s = await getStatus(videoGuid);
    onTick?.(s.status);

    if (s.ready) {
      if (!s.playbackUrl) {
        // Ready but unplayable means BUNNY_CDN_HOSTNAME is unset server-side.
        // The admin-facing message stays provider-neutral; the actionable
        // detail goes to the console so it is still diagnosable.
        console.error('Video ready but no playback URL returned — check BUNNY_CDN_HOSTNAME on the backend.');
        throw new Error('The video processed but no playback URL was returned. Check the server configuration.');
      }
      return { playbackUrl: s.playbackUrl, thumbnailUrl: s.thumbnailUrl };
    }
    if (s.status === 'error' || s.status === 'upload_failed') {
      throw new Error(`This video could not be processed (status: ${s.status}).`);
    }
    await sleep(intervalMs, signal);
  }
  throw new Error('Timed out waiting for the video to finish processing (15 min).');
}

/**
 * Remove a Bunny asset. Called when anything fails after a GUID exists, so a
 * cancelled or broken upload does not leave an orphan in the library.
 * Best-effort by design: the caller is already handling a failure and must not
 * have that failure masked by a second one.
 */
export async function deleteVideo(videoGuid: string): Promise<void> {
  await fetch(`${API_BASE}/api/bunny/videos/${videoGuid}`, { method: 'DELETE' });
}
