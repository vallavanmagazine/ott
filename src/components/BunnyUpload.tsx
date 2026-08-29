import { useRef, useState } from 'react';
import { UploadCloud, Check, Loader } from 'lucide-react';
import { initUpload, uploadFile, pollStatus, deleteVideo, hasBunny } from '@/services/bunny';
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
 */
export function BunnyUpload({
  table,
  recordId,
  title,
  onComplete,
}: {
  table?: string;
  recordId?: string | null;
  title?: string;
  onComplete: (result: BunnyUploadResult) => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const configured = hasBunny();
  const busy = phase.kind === 'uploading' || phase.kind === 'processing';

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only set once a GUID exists, so the cleanup below can never delete
    // something this upload did not create.
    let guid: string | null = null;
    setPhase({ kind: 'uploading', pct: 0 });

    try {
      const ticket = await initUpload((title || '').trim() || file.name);
      guid = ticket.videoGuid;

      await uploadFile(file, ticket.tusEndpoint, ticket.tusHeaders, (pct) =>
        setPhase({ kind: 'uploading', pct }),
      );

      // Bytes are in; Bunny now transcodes, which is the slow part.
      setPhase({ kind: 'processing', status: 'processing' });
      const { playbackUrl, thumbnailUrl } = await pollStatus(guid, (status) =>
        setPhase({ kind: 'processing', status }),
      );

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
      setPhase({ kind: 'idle' });
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
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
        title={configured ? 'Upload to Bunny Stream' : 'Set VITE_API_BASE_URL to enable'}
        data-table={table}
        data-record-id={recordId ?? undefined}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg glass text-sm font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {phase.kind === 'uploading' ? <><Loader size={14} className="animate-spin" /> Uploading {phase.pct}%</>
          : phase.kind === 'processing' ? <><Loader size={14} className="animate-spin" /> Processing on Bunny…</>
          : phase.kind === 'done' ? <><Check size={14} className="text-green-400" /> Uploaded — URL filled</>
          : <><UploadCloud size={14} /> {configured ? 'Upload Video (Bunny)' : 'Upload (set backend URL)'}</>}
      </button>

      {phase.kind === 'uploading' && (
        <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-vred transition-all" style={{ width: `${phase.pct}%` }} />
        </div>
      )}
      {phase.kind === 'processing' && (
        <p className="mt-1.5 text-[11px] text-white/60">
          Bunny is transcoding. This can take several minutes for a long video — leave this open.
        </p>
      )}
    </div>
  );
}
