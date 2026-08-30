import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Check, Loader, X } from 'lucide-react';
import { initUpload, uploadFile, pollStatus, deleteVideo, hasBunny, isAborted } from '@/services/bunny';
import { useToast } from '@/components/admin/Toast';

/** What a finished upload hands back into the screen's form state. */
export interface BunnyUploadResult {
  videoUrl: string;
  thumbnailUrl: string | null;
  videoProvider: 'bunny';
  bunnyVideoId: string;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'uploading'; pct: number }
  | { kind: 'processing'; status: string }
  | { kind: 'done' };

/**
 * Admin upload button: file → Bunny (direct, over TUS) → fills the form.
 *
 * Deliberately mirrors DyneTubeUpload's shape and progress-bar UX so it drops
 * into the same slot in each editor. The important difference is invisible: the
 * API key stays on the server, and the browser uploads with a per-video
 * signature instead.
 *
 * It does NOT touch the database. Like DyneTubeUpload it only calls onComplete
 * with values for form state, which the screen's existing Save button writes —
 * so this works the same in "Add" (no row yet) and "Edit" (row exists).
 *
 * `table`/`recordId` are accepted purely as correlation hints for the backend
 * and are optional; nothing here depends on a row existing.
 *
 * `onBusyChange` is what stops the editor saving a half-finished upload. The
 * phase below used to be invisible to the screen, so its Save button stayed
 * live through the whole transcode and an admin who clicked it wrote a row with
 * no video_url and a placeholder thumbnail. The screen now mirrors this flag
 * onto SaveBar's `disabled` and onto its close handler.
 */
export function BunnyUpload({
  table,
  recordId,
  title,
  onComplete,
  onBusyChange,
}: {
  table?: string;
  recordId?: string | null;
  title?: string;
  onComplete: (result: BunnyUploadResult) => void;
  /** Fired whenever an upload starts or stops. See the note above. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const configured = hasBunny();
  const busy = phase.kind === 'uploading' || phase.kind === 'processing';

  /** Live handles for the in-flight upload, so cancel and unmount can reach it. */
  const abortRef = useRef<AbortController | null>(null);
  const guidRef = useRef<string | null>(null);
  // The unmount cleanup below has an empty dep list, so it must read the prop
  // through a ref rather than closing over the first render's value.
  const onBusyChangeRef = useRef(onBusyChange);
  onBusyChangeRef.current = onBusyChange;

  // Tell the screen. Kept in an effect rather than inline in onFile so the flag
  // can never drift from the phase actually rendered.
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);

  // Unmounting mid-upload (editor closed) would otherwise leave the bytes still
  // going to a video nothing will ever reference. Abort and clean up.
  useEffect(() => () => {
    abortRef.current?.abort();
    if (guidRef.current) void deleteVideo(guidRef.current).catch(() => {});
    onBusyChangeRef.current?.(false);
  }, []);

  const pick = () => inputRef.current?.click();

  /** Abandon the upload in progress; the catch in onFile bins the partial asset. */
  const cancel = () => abortRef.current?.abort();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only set once a GUID exists, so the cleanup below can never delete
    // something this upload did not create.
    let guid: string | null = null;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPhase({ kind: 'uploading', pct: 0 });

    try {
      const ticket = await initUpload((title || '').trim() || file.name);
      guid = ticket.videoGuid;
      guidRef.current = guid;

      await uploadFile(
        file,
        ticket.tusEndpoint,
        ticket.tusHeaders,
        (pct) => setPhase({ kind: 'uploading', pct }),
        ctrl.signal,
      );

      // Bytes are in; Bunny now transcodes, which is the slow part.
      setPhase({ kind: 'processing', status: 'processing' });
      const { playbackUrl, thumbnailUrl } = await pollStatus(
        guid,
        (status) => setPhase({ kind: 'processing', status }),
        ctrl.signal,
      );

      guidRef.current = null; // handed to the form; no longer an orphan to bin
      onComplete({
        videoUrl: playbackUrl,
        thumbnailUrl,
        videoProvider: 'bunny',
        bunnyVideoId: guid,
      });
      setPhase({ kind: 'done' });
      toast.success('Video uploaded — URL filled in. Save to keep it.');
    } catch (err) {
      // Anything after the GUID exists leaves an orphan in the Bunny library
      // unless we clean up. Best-effort: never let cleanup mask the real error.
      if (guid) await deleteVideo(guid).catch(() => {});
      guidRef.current = null;
      setPhase({ kind: 'idle' });
      // A cancel is a deliberate act, not a failure — no error toast for it.
      if (!isAborted(err)) toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      abortRef.current = null;
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={pick}
        disabled={!configured || busy}
        title={configured ? 'Upload a video file' : 'Upload unavailable — the backend is not configured'}
        data-table={table}
        data-record-id={recordId ?? undefined}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg glass text-sm font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {phase.kind === 'uploading' ? <><Loader size={14} className="animate-spin" /> Uploading {phase.pct}%</>
          : phase.kind === 'processing' ? <><Loader size={14} className="animate-spin" /> Processing…</>
          : phase.kind === 'done' ? <><Check size={14} className="text-green-400" /> Uploaded — URL filled</>
          : <><UploadCloud size={14} /> Upload Video</>}
      </button>

      {phase.kind === 'uploading' && (
        <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-vred transition-all" style={{ width: `${phase.pct}%` }} />
        </div>
      )}

      {busy && (
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <p className="text-[11px] text-vgold">
            {phase.kind === 'uploading'
              ? 'Sending your video. Don’t close this window.'
              : 'Processing your video. This can take several minutes for a long video — leave this open.'}
            {' '}Saving is disabled until it finishes.
          </p>
          <button
            type="button"
            onClick={cancel}
            className="flex items-center gap-1 text-[11px] text-vmuted hover:text-white flex-shrink-0"
          >
            <X size={11} /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}
