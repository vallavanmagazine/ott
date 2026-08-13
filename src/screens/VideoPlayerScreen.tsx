import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize,
  Cast, ChevronLeft, ArrowRight,
} from 'lucide-react';
import { type Documentary, pexelsUrl, ads as mockAds } from '@/data/mockData';
import { fetchAds } from '@/services/ads';
import { detectVideoKind, youtubeEmbedUrl, attachVideo } from '@/lib/video-player';
import { detectDistrict } from '@/lib/geo-detect';
import { trackImpression } from '@/services/ad-engine';
import { addToHistory } from '@/lib/library';

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayerScreen({ item, onBack }: { item: Documentary; onBack: () => void }) {
  const kind = detectVideoKind(item.videoUrl);
  const hasRealVideo = kind === 'mp4' || kind === 'hls';
  const isYouTube = kind === 'youtube';
  const hasNoVideo = kind === 'none';

  const [playing, setPlaying] = useState(false);
  const [showAd, setShowAd] = useState(!hasNoVideo);   // pre-roll (skip if no video)
  const [adCountdown, setAdCountdown] = useState(5);
  const [showMidRoll, setShowMidRoll] = useState(false);
  const [midRollShown, setMidRollShown] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.durationSec || 0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allAds, setAllAds] = useState(mockAds);
  const [district, setDistrict] = useState('Chennai');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount: ads, district, history, orientation lock.
  useEffect(() => {
    fetchAds().then(setAllAds);
    detectDistrict().then(setDistrict);
    if (item.id !== 'live-player') addToHistory(item);
    try {
      const lock = (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock;
      lock?.call(screen.orientation, 'landscape').catch(() => {});
    } catch { /* unsupported */ }
    return () => {
      try { (screen.orientation as unknown as { unlock?: () => void })?.unlock?.(); } catch { /* unsupported */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-roll 5s countdown → auto-dismiss.
  useEffect(() => {
    if (!showAd) return;
    if (allAds[0]) trackImpression(allAds[0].id, undefined, district);
    setAdCountdown(5);
    const t = setInterval(() => {
      setAdCountdown((c) => {
        if (c <= 1) { clearInterval(t); setShowAd(false); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAd, allAds, district]);

  // Attach real content video once ads are done.
  useEffect(() => {
    if (showAd || showMidRoll || !hasRealVideo || !item.videoUrl) return;
    const v = videoRef.current;
    if (!v) return;
    const cleanup = attachVideo(v, item.videoUrl);
    v.play().then(() => setPlaying(true)).catch(() => {});
    return cleanup;
  }, [showAd, showMidRoll, hasRealVideo, item.videoUrl]);

  // Fullscreen state sync.
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (v) { if (v.paused) v.play().catch(() => {}); else v.pause(); }
    setShowControls(true);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    // Mid-roll at 50%.
    if (!midRollShown && v.duration > 0 && v.currentTime / v.duration >= 0.5) {
      setMidRollShown(true);
      setShowMidRoll(true);
      v.pause();
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    const t = Number(e.target.value);
    setCurrentTime(t);
    if (v) v.currentTime = t;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (v) v.muted = next;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  const skip = (delta: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  };

  const ad = allAds[0];
  const midAd = allAds[1] ?? allAds[0];

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="relative flex-1 bg-black" onClick={() => setShowControls((s) => !s)}>
        {/* --- Content surface --- */}
        {isYouTube && !showAd && !showMidRoll && item.videoUrl ? (
          <iframe
            src={youtubeEmbedUrl(item.videoUrl)}
            title={item.title}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : hasRealVideo && !showAd && !showMidRoll ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            playsInline
            onClick={togglePlay}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => { setEnded(true); setPlaying(false); }}
          />
        ) : (
          <>
            <img src={pexelsUrl(item.backdrop, 800)} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            {hasNoVideo && !showAd && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mb-3"><Play size={30} className="text-white/70 ml-1" /></div>
                <p className="text-white font-bold">Video coming soon</p>
                <p className="text-xs text-vmuted mt-1">This title isn't available to stream yet.</p>
              </div>
            )}
          </>
        )}

        {/* --- Pre-roll ad --- */}
        {showAd && ad && (
          <div className="absolute inset-0 bg-black flex flex-col z-20">
            <div className="aspect-video w-full bg-black relative">
              <img src={pexelsUrl(ad.bgImage, 800)} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black">Ad · {adCountdown}s</div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[10px] text-vgold font-bold">{ad.sponsor}</div>
                <div className="text-base font-black text-white">{ad.headline}</div>
                <button className="mt-2 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold">{ad.cta}</button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <button onClick={() => setShowAd(false)} disabled={adCountdown > 0} className="px-5 py-2.5 rounded-full glass text-white text-sm font-bold active:scale-95 disabled:opacity-40">
                {adCountdown > 0 ? `Skip in ${adCountdown}s` : <>Skip Ad <ArrowRight size={14} className="inline" /></>}
              </button>
            </div>
          </div>
        )}

        {/* --- Mid-roll --- */}
        {showMidRoll && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20">
            <div className="px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black mb-4">Mid-roll Ad</div>
            <div className="w-full max-w-md aspect-video rounded-card overflow-hidden mb-4"><img src={pexelsUrl(midAd.bgImage, 400)} alt="" className="w-full h-full object-cover" /></div>
            <p className="text-sm font-bold text-white text-center">{midAd.headline}</p>
            <button onClick={() => { setShowMidRoll(false); videoRef.current?.play().catch(() => {}); }} className="mt-4 px-5 py-2.5 rounded-full bg-vred text-white text-sm font-bold active:scale-95">Skip Ad</button>
          </div>
        )}

        {/* --- End overlay --- */}
        {ended && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20">
            <h3 className="text-lg font-black text-white mb-4">You finished watching</h3>
            <div className="flex gap-2">
              <button onClick={() => { setEnded(false); const v = videoRef.current; if (v) { v.currentTime = 0; v.play(); } }} className="px-5 py-2.5 rounded-full glass text-white text-xs font-bold">Replay</button>
              <button onClick={onBack} className="px-5 py-2.5 rounded-full bg-vred text-white text-xs font-bold">Done</button>
            </div>
          </div>
        )}

        {/* --- Top bar (always available) --- */}
        {showControls && !showAd && !showMidRoll && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent safe-top z-10">
            <div className="flex items-center justify-between">
              <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 active:scale-90"><ChevronLeft size={20} className="text-white" /></button>
              <div className="text-center flex-1 mx-3">
                <div className="text-sm font-bold text-white truncate">{item.title}</div>
                <div className="text-[10px] text-vmuted">{item.genre} · {item.duration}</div>
              </div>
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 active:scale-90"><Cast size={16} className="text-white" /></button>
            </div>
          </div>
        )}

        {/* --- Custom controls for native video only (YouTube uses its own) --- */}
        {hasRealVideo && showControls && !showAd && !showMidRoll && !ended && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="flex items-center gap-8 pointer-events-auto">
                <button onClick={() => skip(-10)} className="w-10 h-10 flex items-center justify-center active:scale-90"><SkipBack size={22} className="text-white/80" fill="currentColor" /></button>
                <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition">
                  {playing ? <Pause size={28} className="text-white" fill="currentColor" /> : <Play size={28} className="text-white ml-1" fill="currentColor" />}
                </button>
                <button onClick={() => skip(10)} className="w-10 h-10 flex items-center justify-center active:scale-90"><SkipForward size={22} className="text-white/80" fill="currentColor" /></button>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent safe-bottom z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-white w-10 text-right">{fmt(currentTime)}</span>
                <input
                  type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                  onChange={seek}
                  className="flex-1 h-1.5 accent-vred cursor-pointer"
                  style={{ accentColor: '#D32F2F' }}
                />
                <span className="text-[10px] text-vmuted w-10">{fmt(duration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={toggleMute} className="active:scale-90">{muted ? <VolumeX size={18} className="text-white/80" /> : <Volume2 size={18} className="text-white/80" />}</button>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={toggleFullscreen} className="active:scale-90">{isFullscreen ? <Minimize size={18} className="text-white/80" /> : <Maximize size={18} className="text-white/80" />}</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Back button when YouTube/no-video (no custom controls) */}
        {(isYouTube || hasNoVideo) && !showAd && (
          <button onClick={onBack} className="absolute top-4 left-4 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 active:scale-90"><ChevronLeft size={20} className="text-white" /></button>
        )}
      </div>
    </div>
  );
}
