import { useRef, useState } from 'react';
import { UploadCloud, Check, Loader } from 'lucide-react';
import { uploadVideo, hasDyneTube } from '@/services/dynetube';
import { useToast } from '@/components/admin/Toast';

/** Admin upload button: file → DyneTube → returns HLS URL to fill video_url. */
export function DyneTubeUpload({ onUploaded }: { onUploaded: (hlsUrl: string) => void }) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const configured = hasDyneTube();

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(false); setPct(0);
    try {
      const video = await uploadVideo(file, setPct);
      onUploaded(video.hlsUrl || video.playerUrl);
      setDone(true);
      toast.success('Video uploaded — URL filled in');
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      setPct(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={pick}
        disabled={!configured || pct !== null}
        title={configured ? 'Upload to DyneTube' : 'Set VITE_DYNETUBE_API_KEY to enable'}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg glass text-sm font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {pct !== null ? <><Loader size={14} className="animate-spin" /> Uploading {pct}%</>
          : done ? <><Check size={14} className="text-green-400" /> Uploaded — URL filled</>
          : <><UploadCloud size={14} /> {configured ? 'Upload Video (DyneTube)' : 'Upload (set API key)'}</>}
      </button>
      {pct !== null && (
        <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-vred transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}
