import { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Minimize,
  Cast, ChevronLeft, ArrowRight, X,
} from 'lucide-react';
import { type Documentary, genreColors, pexelsUrl } from '@/data/mockData';
import { fetchDocumentaries } from '@/services/documentaries';
import { ContentCard } from '@/components/ContentCard';
import { SectionRow } from '@/components/ui';
import { detectVideoKind, youtubeEmbedUrl, attachVideo } from '@/lib/video-player';
import { detectDistrict } from '@/lib/geo-detect';
import { getVideoAd, getOverlayAd, getHouseAd, trackAdImpression, trackAdClick, type ServedAd } from '@/services/ad-engine';
import { addToHistory } from '@/lib/library';

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const MIDROLL_MIN_SEC = 300; // mid-roll only for videos longer than 5 min

export function VideoPlayerScreen({ item, onBack, onPlayRelated }: {
  item: Documentary;
  onBack: () => void;
  onPlayRelated: (d: Documentary) => void;
}) {
  const kind = detectVideoKind(item.videoUrl);
  const hasRealVideo = kind === 'mp4' || kind === 'hls';
  const isYouTube = kind === 'youtube';
  const hasNoVideo = kind === 'none';

  const [playing, setPlaying] = useState(false);
  const [showAd, setShowAd] = useState(!hasNoVideo);       // pre-roll (mandatory)
  const [adCountdown, setAdCountdown] = useState(5);
  const [showMidRoll, setShowMidRoll] = useState(false);
  const [midRollShown, setMidRollShown] = useState(false);
  const [ended, setEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(item.durationSec || 0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [district, setDistrict] = useState('Chennai');
  const [related, setRelated] = useState<Documentary[]>([]);

  // Geo-targeted ad creatives per slot.
  const [preroll, setPreroll] = useState<ServedAd>(getHouseAd());
  const [midroll, setMidroll] = useState<ServedAd>(getHouseAd());
  const [postroll, setPostroll] = useState<ServedAd>(getHouseAd());
  const [strip, setStrip] = useState<ServedAd>(getHouseAd());
  const [stripVisible, setStripVisible] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const prerollTracked = useRef(false);
  const stripSchedule = useRef<((ms: number) => void) | null>(null);

  // Reset + fetch geo-targeted ads whenever the item changes.
  useEffect(() => {
    const noVideo = detectVideoKind(item.videoUrl) === 'none';
    setShowAd(!noVideo); setShowMidRoll(false); setMidRollShown(false); setEnded(false);
    setCurrentTime(0); setDuration(item.durationSec || 0); setPlaying(false);
    setStripVisible(false); prerollTracked.current = false;
    if (item.id !== 'live-player') addToHistory(item);
    fetchDocumentaries().then((docs) => setRelated(docs.filter((d) => d.id !== item.id && d.genre === item.genre).slice(0, 8)));

    detectDistrict().then(async (d) => {
      setDistrict(d);
      const pre = await getVideoAd(d);
      setPreroll(pre);
      setMidroll(await getVideoAd(d, [pre.ad.id]));         // rotate: different from pre-roll
      setPostroll(await getOverlayAd(d, [pre.ad.id]));
      setStrip(await getOverlayAd(d));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // Pre-roll countdown + impression (mandatory before content).
  useEffect(() => {
    if (!showAd) return;
    if (!prerollTracked.current) { trackAdImpression(preroll.ad.id, preroll.campaignId, district, 'preroll'); prerollTracked.current = true; }
    setAdCountdown(5);
    const t = setInterval(() => setAdCountdown((c) => { if (c <= 1) { clearInterval(t); setShowAd(false); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAd, preroll, district]);

  // Attach native/HLS video once ads are done.
  useEffect(() => {
    if (showAd || showMidRoll || !hasRealVideo || !item.videoUrl) return;
    const v = videoRef.current;
    if (!v) return;
    const cleanup = attachVideo(v, item.videoUrl);
    v.play().then(() => setPlaying(true)).catch(() => {});
    return cleanup;
  }, [showAd, showMidRoll, hasRealVideo, item.videoUrl]);

  // Timer-based STRIP overlay: first at 30s, shows 8s, then every 90s; dismiss → 2 min.
  useEffect(() => {
    if (showAd || showMidRoll || ended || hasNoVideo) return;
    let hideT: ReturnType<typeof setTimeout>;
    let nextT: ReturnType<typeof setTimeout>;
    const show = () => {
      setStripVisible(true);
      trackAdImpression(strip.ad.id, strip.campaignId, district, 'strip');
      hideT = setTimeout(() => { setStripVisible(false); schedule(90_000); }, 8_000);
    };
    const schedule = (ms: number) => { nextT = setTimeout(show, ms); };
    stripSchedule.current = (ms: number) => { clearTimeout(hideT); clearTimeout(nextT); setStripVisible(false); schedule(ms); };
    schedule(30_000);
    return () => { clearTimeout(hideT); clearTimeout(nextT); stripSchedule.current = null; };
  }, [showAd, showMidRoll, ended, hasNoVideo, strip, district]);

  // Post-roll impression when the end card appears.
  useEffect(() => { if (ended) trackAdImpression(postroll.ad.id, postroll.campaignId, district, 'postroll'); }, [ended, postroll, district]);

  // Fullscreen state + landscape lock only while fullscreen.
  useEffect(() => {
    const onFs = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      try {
        const o = screen.orientation as unknown as { lock?: (x: string) => Promise<void>; unlock?: () => void };
        if (fs) o?.lock?.('landscape').catch(() => {}); else o?.unlock?.();
      } catch { /* unsupported */ }
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const togglePlay = () => { const v = videoRef.current; if (v) { v.paused ? v.play().catch(() => {}) : v.pause(); } setShowControls(true); };
  const onTimeUpdate = () => {
    const v = videoRef.current; if (!v) return;
    setCurrentTime(v.currentTime);
    if (!midRollShown && v.duration > MIDROLL_MIN_SEC && v.currentTime / v.duration >= 0.5) { setMidRollShown(true); setShowMidRoll(true); v.pause(); }
  };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => { const v = videoRef.current; const t = Number(e.target.value); setCurrentTime(t); if (v) v.currentTime = t; };
  const toggleMute = () => { const v = videoRef.current; const n = !muted; setMuted(n); if (v) v.muted = n; };
  const skip = (d: number) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + d)); };
  const toggleFullscreen = () => { if (!document.fullscreenElement) stageRef.current?.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.().catch(() => {}); };
  const dismissStrip = () => { setStripVisible(false); stripSchedule.current?.(120_000); };

  const genreColor = genreColors[item.genre] || '#666';
  const nextUp = related[0];

  return (
    <div className="pb-20 min-h-screen">
      {/* Back bar */}
      <header className="sticky top-0 z-30 bg-vblack/90 backdrop-blur-xl border-b border-white/5 safe-top">
        <div className="px-3 py-2.5 flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90"><ChevronLeft size={20} className="text-white" /></button>
          <div className="flex-1 min-w-0"><div className="text-sm font-bold text-white truncate">{item.title}</div></div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90"><Cast size={16} className="text-white/80" /></button>
        </div>
      </header>

      {/* 16:9 video stage */}
      <div ref={stageRef} className="relative w-full aspect-video bg-black" onClick={() => setShowControls((s) => !s)}>
        {isYouTube && !showAd && !showMidRoll ? (
          <iframe src={youtubeEmbedUrl(item.videoUrl!)} title={item.title} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        ) : hasRealVideo && !showAd && !showMidRoll ? (
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-contain bg-black" playsInline
            onClick={togglePlay} onTimeUpdate={onTimeUpdate} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setEnded(true); setPlaying(false); }} />
        ) : (
          <>
            <img src={pexelsUrl(item.backdrop, 800)} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            {hasNoVideo && !showAd && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center mb-2"><Play size={26} className="text-white/70 ml-1" /></div>
                <p className="text-white font-bold text-sm">Video coming soon</p>
              </div>
            )}
          </>
        )}

        {/* PRE-ROLL (mandatory) */}
        {showAd && (
          <AdCard slot="pre" served={preroll} countdown={adCountdown} district={district}
            onSkip={() => setShowAd(false)} />
        )}

        {/* MID-ROLL */}
        {showMidRoll && (
          <AdCard slot="mid" served={midroll} countdown={0} district={district}
            onSkip={() => { setShowMidRoll(false); videoRef.current?.play().catch(() => {}); }} />
        )}

        {/* POST-ROLL sponsor card + Watch Next */}
        {ended && (
          <div className="absolute inset-0 bg-black/92 flex flex-col items-center justify-center gap-3 p-4 z-20 overflow-y-auto">
            <span className="px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black">Sponsored</span>
            <div className="text-center">
              <div className="text-[11px] text-vgold font-bold">{postroll.ad.sponsor}</div>
              <div className="text-sm font-black text-white">{postroll.ad.headline}</div>
              <button onClick={() => trackAdClick(postroll.ad.id, postroll.campaignId, district, 'postroll')} className="mt-2 px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold">{postroll.ad.cta}</button>
            </div>
            {nextUp && (
              <button onClick={() => onPlayRelated(nextUp)} className="mt-1 flex items-center gap-2 p-2 rounded-lg glass max-w-xs">
                <img src={pexelsUrl(nextUp.poster, 200)} alt="" className="w-16 h-10 rounded object-cover" />
                <div className="text-left"><div className="text-[9px] text-vmuted uppercase font-bold">Watch Next</div><div className="text-xs font-bold text-white line-clamp-1">{nextUp.title}</div></div>
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setEnded(false); const v = videoRef.current; if (v) { v.currentTime = 0; v.play(); } }} className="text-[11px] text-vmuted underline">Replay</button>
          </div>
        )}

        {/* STRIP overlay (timer-based, closable) */}
        {stripVisible && !showAd && !showMidRoll && !ended && (
          <div className="absolute bottom-0 left-0 right-0 z-10 p-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-lg bg-black/80 backdrop-blur-sm border border-vgold/30 px-2.5 py-2 flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-vgold rounded text-[7px] font-black uppercase text-black flex-shrink-0">Ad</span>
              <img src={pexelsUrl(strip.ad.bgImage, 100)} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0"><div className="text-[10px] text-vgold font-bold truncate">{strip.ad.sponsor}</div><div className="text-[11px] text-white font-semibold truncate">{strip.ad.headline}</div></div>
              <button onClick={() => trackAdClick(strip.ad.id, strip.campaignId, district, 'strip')} className="px-2.5 py-1 rounded-full bg-white text-black text-[10px] font-bold flex-shrink-0">Learn More</button>
              <button onClick={dismissStrip} className="w-5 h-5 flex items-center justify-center rounded-full bg-white/15 flex-shrink-0"><X size={11} className="text-white" /></button>
            </div>
          </div>
        )}

        {/* Controls (native video only) */}
        {hasRealVideo && showControls && !showAd && !showMidRoll && !ended && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-6 pointer-events-auto">
                <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="active:scale-90"><SkipBack size={20} className="text-white/80" fill="currentColor" /></button>
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center active:scale-90">{playing ? <Pause size={24} className="text-white" fill="currentColor" /> : <Play size={24} className="text-white ml-0.5" fill="currentColor" />}</button>
                <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="active:scale-90"><SkipForward size={20} className="text-white/80" fill="currentColor" /></button>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white w-9 text-right">{fmt(currentTime)}</span>
                <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime} onChange={seek} className="flex-1 h-1.5 cursor-pointer" style={{ accentColor: '#D32F2F' }} />
                <span className="text-[10px] text-vmuted w-9">{fmt(duration)}</span>
                <button onClick={toggleMute} className="active:scale-90">{muted ? <VolumeX size={16} className="text-white/80" /> : <Volume2 size={16} className="text-white/80" />}</button>
                <button onClick={toggleFullscreen} className="active:scale-90">{isFullscreen ? <Minimize size={16} className="text-white/80" /> : <Maximize size={16} className="text-white/80" />}</button>
              </div>
            </div>
          </>
        )}

        {isYouTube && !showAd && (
          <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center z-10">{isFullscreen ? <Minimize size={15} className="text-white" /> : <Maximize size={15} className="text-white" />}</button>
        )}
      </div>

      {/* Metadata */}
      <div className="px-4 mt-3">
        <h1 className="text-lg font-black text-white leading-tight">{item.title}</h1>
        <p className="text-sm font-tamil text-vgold leading-tight">{item.titleTa}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase text-white" style={{ backgroundColor: genreColor }}>{item.genre}</span>
          <span className="text-[11px] text-vmuted">{item.year} · {item.duration} · {item.language}</span>
        </div>
        {item.synopsis && <p className="text-sm text-white/85 leading-relaxed mt-3">{item.synopsis}</p>}
        {item.synopsisTa && <p className="text-[13px] font-tamil text-vmuted leading-relaxed mt-1.5">{item.synopsisTa}</p>}
        {(item.director || (item.cast && item.cast.length > 0)) && (
          <div className="mt-3 text-[12px] text-vmuted">
            {item.director && <div><span className="text-white/60">Director:</span> <span className="text-white font-semibold">{item.director}</span></div>}
            {item.cast && item.cast.length > 0 && <div className="mt-0.5"><span className="text-white/60">Cast:</span> <span className="text-white font-semibold">{item.cast.join(', ')}</span></div>}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <SectionRow title="Related Videos" titleTa="தொடர்புடைய">
          {related.map((d) => <ContentCard key={d.id} item={d} onClick={() => onPlayRelated(d)} />)}
        </SectionRow>
      )}

      <div className="h-6" />
    </div>
  );
}

/** Full-stage pre/mid-roll ad card (image creative shown for the countdown). */
function AdCard({ slot, served, countdown, district, onSkip }: {
  slot: 'pre' | 'mid'; served: ServedAd; countdown: number; district: string; onSkip: () => void;
}) {
  return (
    <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
      <img src={pexelsUrl(served.ad.bgImage, 800)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black">{slot === 'pre' ? 'Ad' : 'Mid-roll Ad'}{countdown > 0 ? ` · ${countdown}s` : ''}</div>
      <div className="relative text-center px-4">
        <div className="text-[10px] text-vgold font-bold">{served.ad.sponsor}</div>
        <div className="text-sm font-black text-white">{served.ad.headline}</div>
        <button onClick={(e) => { e.stopPropagation(); trackAdClick(served.ad.id, served.campaignId, district, slot === 'pre' ? 'preroll' : 'midroll'); }} className="mt-2 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold">{served.ad.cta}</button>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onSkip(); }} disabled={slot === 'pre' && countdown > 0} className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full glass text-white text-xs font-bold disabled:opacity-40">
        {slot === 'pre' && countdown > 0 ? `Skip ${countdown}s` : <>Skip Ad <ArrowRight size={12} className="inline" /></>}
      </button>
    </div>
  );
}
