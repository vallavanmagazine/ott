import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize,
  Settings, Cast, ChevronLeft, ArrowRight,
} from 'lucide-react';
import { type Documentary, pexelsUrl, ads as mockAds } from '@/data/mockData';
import { fetchAds } from '@/services/ads';
import { detectVideoKind, youtubeEmbedUrl, attachVideo } from '@/lib/video-player';
import { detectDistrict } from '@/lib/geo-detect';
import { trackImpression } from '@/services/ad-engine';

export function VideoPlayerScreen({
  item,
  onBack,
}: {
  item: Documentary;
  onBack: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [showMidRoll, setShowMidRoll] = useState(false);
  const [progress, setProgress] = useState(18);
  const [showControls, setShowControls] = useState(true);
  const [ended, setEnded] = useState(false);
  const [allAds, setAllAds] = useState(mockAds);
  const [district, setDistrict] = useState('Chennai');
  const videoRef = useRef<HTMLVideoElement>(null);
  const kind = detectVideoKind(item.videoUrl);
  const hasRealVideo = kind === 'mp4' || kind === 'hls';

  useEffect(() => {
    fetchAds().then(setAllAds);
    detectDistrict().then(setDistrict);
  }, []);

  // Attach the real content video once the pre-roll/mid-roll ad is done.
  useEffect(() => {
    if (showAd || showMidRoll || !hasRealVideo || !item.videoUrl) return;
    const v = videoRef.current;
    if (!v) return;
    const cleanup = attachVideo(v, item.videoUrl);
    v.play().then(() => setPlaying(true)).catch(() => {});
    return cleanup;
  }, [showAd, showMidRoll, hasRealVideo, item.videoUrl]);

  // Count the pre-roll ad impression (best-effort; needs real UUID ads).
  useEffect(() => {
    if (showAd && allAds[0]) trackImpression(allAds[0].id, undefined, district);
  }, [showAd, allAds, district]);

  const togglePlay = () => {
    if (showAd) return;
    const v = videoRef.current;
    if (v) { if (v.paused) v.play().catch(() => {}); else v.pause(); }
    setPlaying((p) => !p);
    setShowControls(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video area */}
      <div
        className="relative flex-1 bg-black"
        onClick={() => setShowControls((s) => !s)}
      >
        {kind === 'youtube' && !showAd && !showMidRoll && item.videoUrl ? (
          <iframe
            src={youtubeEmbedUrl(item.videoUrl)}
            title={item.title}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : hasRealVideo && !showAd && !showMidRoll ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain bg-black"
            playsInline
            onEnded={() => setEnded(true)}
          />
        ) : (
          <img src={pexelsUrl(item.backdrop, 800)} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
        )}

        {/* Pre-roll ad overlay */}
        {showAd && (
          <div className="absolute inset-0 bg-black flex flex-col">
            <div className="aspect-video w-full bg-black relative">
              <img src={pexelsUrl(allAds[0].bgImage, 800)} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black">
                Ad · 0:05
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[10px] text-vgold font-bold">{allAds[0].sponsor}</div>
                <div className="text-base font-black text-white">{allAds[0].headline}</div>
                <button className="mt-2 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold">
                  {allAds[0].cta}
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={() => setShowAd(false)}
                className="px-5 py-2.5 rounded-full glass text-white text-sm font-bold active:scale-95"
              >
                Skip Ad <ArrowRight size={14} className="inline" />
              </button>
            </div>
          </div>
        )}

        {/* Mid-roll interstitial */}
        {showMidRoll && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20">
            <div className="px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black mb-4">
              Mid-roll Ad
            </div>
            <div className="w-full aspect-[16/9] rounded-card overflow-hidden mb-4">
              <img src={pexelsUrl(allAds[1].bgImage, 400)} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-bold text-white text-center">{allAds[1].headline}</p>
            <button
              onClick={() => setShowMidRoll(false)}
              className="mt-4 px-5 py-2.5 rounded-full bg-vred text-white text-sm font-bold active:scale-95"
            >
              Skip Ad
            </button>
          </div>
        )}

        {/* End overlay */}
        {ended && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 z-20">
            <h3 className="text-lg font-black text-white mb-1">Up Next</h3>
            <p className="text-xs text-vmuted mb-4">More Like This</p>
            <div className="w-full aspect-video rounded-card overflow-hidden mb-4 relative">
              <img src={pexelsUrl(item.backdrop, 400)} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play size={32} fill="white" className="text-white" />
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => { setEnded(false); setProgress(0); setPlaying(true); }}
                className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold"
              >
                Replay
              </button>
              <button className="flex-1 py-2.5 rounded-full bg-vred text-white text-xs font-bold">
                Play Next
              </button>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        {!showAd && !showMidRoll && !ended && showControls && (
          <>
            {/* top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent safe-top">
              <div className="flex items-center justify-between">
                <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 active:scale-90">
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <div className="text-center flex-1 mx-3">
                  <div className="text-sm font-bold text-white truncate">{item.title}</div>
                  <div className="text-[10px] text-vmuted">{item.genre} · {item.duration}</div>
                </div>
                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 active:scale-90">
                  <Cast size={16} className="text-white" />
                </button>
              </div>
            </div>

            {/* center play/pause */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-8 pointer-events-auto">
                <button className="w-10 h-10 flex items-center justify-center active:scale-90">
                  <SkipBack size={22} className="text-white/80" fill="currentColor" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition"
                >
                  {playing ? (
                    <Pause size={28} className="text-white" fill="currentColor" />
                  ) : (
                    <Play size={28} className="text-white ml-1" fill="currentColor" />
                  )}
                </button>
                <button className="w-10 h-10 flex items-center justify-center active:scale-90">
                  <SkipForward size={22} className="text-white/80" fill="currentColor" />
                </button>
              </div>
            </div>

            {/* bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent safe-bottom">
              {/* scrubber */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold text-white">{formatTime(item.durationSec * progress / 100)}</span>
                <div
                  className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = ((e.clientX - rect.left) / rect.width) * 100;
                    setProgress(Math.max(0, Math.min(100, pct)));
                    if (progress > 45 && progress < 55) setShowMidRoll(true);
                  }}
                >
                  <div className="h-full bg-vred rounded-full relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-vred rounded-full shadow-glow" />
                  </div>
                </div>
                <span className="text-[10px] text-vmuted">{item.duration}</span>
              </div>

              {/* buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="active:scale-90"><Volume2 size={18} className="text-white/80" /></button>
                  <button
                    onClick={() => setShowMidRoll(true)}
                    className="active:scale-90 text-[10px] font-bold text-vgold bg-vgold/20 px-2 py-0.5 rounded"
                  >
                    AD
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button className="active:scale-90"><Settings size={18} className="text-white/80" /></button>
                  <button className="active:scale-90"><Maximize size={18} className="text-white/80" /></button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* End trigger demo button */}
        {!showAd && !showMidRoll && !ended && (
          <button
            onClick={() => setEnded(true)}
            className="absolute bottom-20 right-3 px-2 py-1 rounded bg-white/10 text-[9px] text-vmuted z-10"
          >
            Demo: End
          </button>
        )}
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
