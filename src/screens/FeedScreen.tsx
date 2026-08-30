import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Heart, Share2, Volume2, VolumeX, Eye, Pause, RotateCcw, RotateCw,
  ChevronUp, ChevronDown, Play, ArrowRight, Bell, Cast, Tv,
} from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import { ShareSheet } from '@/components/ShareSheet';
import { nativeShare, shareRef, shareUrl } from '@/services/share';
import { bumpFeedMetric } from '@/services/feed-metrics';
import { getLikedReels, setReelLiked } from '@/lib/library';
import {
  genreColors,
  pexelsUrl,
  type FeedReel,
  type AdContent,
} from '@/data/mockData';
import { fetchFeedReels } from '@/services/feed';
import { fetchAds } from '@/services/ads';
import { attachVideo, detectVideoKind, youtubeEmbedUrl } from '@/lib/video-player';

interface FeedItem {
  type: 'reel';
  reel: FeedReel;
  stripAd?: AdContent;
}

interface BannerItem {
  type: 'banner';
  ad: AdContent;
}

type Item = FeedItem | BannerItem;

/** A full-screen ad item goes in after every Nth reel. */
const AD_EVERY_N_REELS = 3;

/** Step for the on-screen rewind / forward buttons. */
const SKIP_SECONDS = 10;

/** How long an ad item holds the screen before the feed moves on. */
const AD_DWELL_MS = 10_000;

function buildFeedSequence(feedReels: FeedReel[], ads: AdContent[]): Item[] {
  const items: Item[] = [];
  // FIX 3: keep the incoming order (service returns latest-first).
  const sorted = feedReels;

  // Walks the ad list once per inserted ad, so consecutive ad breaks show
  // different sponsors instead of the same creative every time. Indexing by
  // reel position (the old rule) repeated a sponsor whenever the gap between
  // breaks divided evenly into the list length.
  let adCursor = 0;

  sorted.forEach((reel, idx) => {
    // The top strip overlay is now only where an admin explicitly asked for
    // one. It used to also fire automatically every third reel, which is what
    // made the ads look pinned to the top of the screen; the every-third rule
    // now produces a real feed item instead.
    const stripAd = reel.stripAdHost && ads.length ? ads[idx % ads.length] : undefined;

    items.push({ type: 'reel', reel, stripAd });

    if (ads.length && (reel.bannerAfter || (idx + 1) % AD_EVERY_N_REELS === 0)) {
      items.push({ type: 'banner', ad: ads[adCursor % ads.length] });
      adCursor++;
    }
  });

  return items;
}

/** "1:07" from a number of seconds; "0:00" for an unknown duration. */
const clock = (sec: number): string => {
  const s = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const formatCount = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

const AUTO_HIDE_MS = 3500;

export function FeedScreen({
  onNotifications,
  onLive,
}: {
  onNotifications?: () => void;
  onLive?: () => void;
}) {
  const device = useDevice();
  // Seeded empty, not with mockData. The mock reels are the same ten the seed
  // created, so using them as the first paint meant a viewer saw a plausible
  // fake feed for as long as the query took — and forever if it never answered.
  const [rawReels, setRawReels] = useState<FeedReel[]>([]);
  const [allAds, setAllAds] = useState<AdContent[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  /** Keeps an in-flight query from reading as "there is no content". */
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    Promise.all([fetchFeedReels(), fetchAds()])
      .then(([reels, adList]) => {
        setRawReels(reels);
        setAllAds(adList);
        setLoadState('ready');
      })
      .catch((e: Error) => {
        // Unreachable before: the service answered every failure with mock
        // reels, so this .catch did not even exist. The reason is now shown.
        console.error('Feed failed to load:', e);
        setLoadError(e.message);
        setLoadState('error');
      });
  }, []);

  // FIX 3: no categories - latest first. Text search lives in the Search tab.
  //
  // Memoised deliberately: this used to rebuild on every render, so `items` got
  // a fresh identity each time and the ad-dwell effect below — which depends on
  // it — cleared and restarted its 10s timer on every unrelated re-render (the
  // chrome auto-hiding, a like landing). An ad could sit there indefinitely.
  const items = useMemo(() => buildFeedSequence(rawReels, allAds), [rawReels, allAds]);
  const [muted, setMuted] = useState(true);
  // Seeded from localStorage so a reload cannot count the same like twice.
  const [liked, setLiked] = useState<Set<string>>(() => new Set(getLikedReels()));
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimer = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-hide the chrome (header + title + actions) so the reel fills the frame.
  const showOverlay = useCallback(() => {
    setOverlayVisible(true);
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    overlayTimer.current = setTimeout(() => setOverlayVisible(false), AUTO_HIDE_MS);
  }, []);

  // Re-show on every reel change; clear the pending timer on unmount.
  useEffect(() => {
    showOverlay();
    return () => { if (overlayTimer.current) clearTimeout(overlayTimer.current); };
  }, [activeIdx, showOverlay]);

  const scrollToIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    itemRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' });
    setActiveIdx(clamped);
  }, [items.length]);

  /**
   * Ad items advance on a fixed timer, content items do not.
   *
   * A reel ends when the media ends (ReelCard's onEnded). An ad is a still
   * image with no natural end at all, so it gets exactly AD_DWELL_MS on screen
   * and then the feed moves on — the dwell is deliberately independent of the
   * creative, so a sponsor cannot buy extra screen time by supplying a longer
   * asset. Keyed on activeIdx, so scrolling away cancels the pending advance.
   */
  useEffect(() => {
    if (items[activeIdx]?.type !== 'banner') return;
    if (activeIdx >= items.length - 1) return; // nothing to advance to
    const t = setTimeout(() => scrollToIndex(activeIdx + 1), AD_DWELL_MS);
    return () => clearTimeout(t);
  }, [activeIdx, items, scrollToIndex]);

  // Wheel scroll on desktop
  useEffect(() => {
    if (device.isMobile || device.isTablet) return;
    const el = containerRef.current;
    if (!el) return;
    let wheelTimer: ReturnType<typeof setTimeout>;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelTimer) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      scrollToIndex(activeIdx + dir);
      wheelTimer = setTimeout(() => { wheelTimer = undefined as unknown as ReturnType<typeof setTimeout>; }, 500);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [activeIdx, device.isMobile, device.isTablet, scrollToIndex]);

  // Keyboard navigation (D-pad for TV, arrow keys for desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToIndex(activeIdx + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToIndex(activeIdx - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((m) => !m);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIdx, scrollToIndex]);

  /** Move a reel's counter and settle on whatever the database ends up holding. */
  const bumpCount = useCallback(async (id: string, metric: 'likes' | 'shares', delta: 1 | -1) => {
    // Optimistic first: the tap has to feel instant, and the number beside the
    // icon must never disagree with the icon's own state.
    setRawReels((prev) => prev.map((r) => (
      r.id === id ? { ...r, [metric]: Math.max(0, (r[metric] ?? 0) + delta) } : r
    )));
    try {
      const settled = await bumpFeedMetric(id, metric, delta);
      setRawReels((prev) => prev.map((r) => (r.id === id ? { ...r, [metric]: settled } : r)));
      return true;
    } catch (e) {
      // Roll the optimistic step back rather than leave a count that no refresh
      // will reproduce.
      console.error(`Could not persist ${metric}:`, e);
      setRawReels((prev) => prev.map((r) => (
        r.id === id ? { ...r, [metric]: Math.max(0, (r[metric] ?? 0) - delta) } : r
      )));
      return false;
    }
  }, []);

  const toggleLike = useCallback(async (id: string) => {
    const nowLiked = !liked.has(id);
    setLiked((prev) => {
      const next = new Set(prev);
      if (nowLiked) next.add(id); else next.delete(id);
      return next;
    });
    setReelLiked(id, nowLiked);

    if (!(await bumpCount(id, 'likes', nowLiked ? 1 : -1))) {
      // The write failed; put the heart back so it matches the stored count.
      setLiked((prev) => {
        const next = new Set(prev);
        if (nowLiked) next.delete(id); else next.add(id);
        return next;
      });
      setReelLiked(id, !nowLiked);
    }
  }, [liked, bumpCount]);

  const countShare = useCallback((id: string) => { void bumpCount(id, 'shares', 1); }, [bumpCount]);

  // Height: full viewport minus bottom nav (mobile/tablet) or side rail offset (desktop/TV)
  const isSideNav = device.isDesktop || device.isTV;

  return (
    <div
      className={`fixed inset-0 z-40 bg-black ${isSideNav ? 'lg:pl-20 xl:pl-60' : ''}`}
    >
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        onClick={showOverlay}
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollTop / el.clientHeight);
          if (idx !== activeIdx) setActiveIdx(idx);
        }}
      >
        {items.length === 0 && (
          <div className="h-full w-full flex flex-col items-center justify-center text-center px-6">
            {loadState === 'loading' ? (
              <p className="text-xs text-vmuted">Loading…</p>
            ) : loadState === 'error' ? (
              <>
                <p className="text-white font-bold">Couldn’t load the feed</p>
                <p className="text-xs text-vmuted mt-1 max-w-xs break-words">{loadError}</p>
              </>
            ) : (
              <>
                <p className="text-white font-bold">Nothing here yet</p>
                <p className="text-xs text-vmuted mt-1">Check back soon for new reels.</p>
              </>
            )}
          </div>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="h-full w-full snap-start snap-always relative flex items-center justify-center"
          >
            {item.type === 'reel' ? (
              <ReelCard
                reel={item.reel}
                stripAd={item.stripAd}
                active={i === activeIdx}
                overlayVisible={overlayVisible}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                liked={liked.has(item.reel.id)}
                onLike={() => toggleLike(item.reel.id)}
                onShared={() => countShare(item.reel.id)}
                onEnded={() => scrollToIndex(i + 1)}
                isLast={i === items.length - 1}
              />
            ) : (
              <BannerReel ad={item.ad} />
            )}
          </div>
        ))}
      </div>

      {/* Desktop/TV: on-screen up/down chevrons */}
      {isSideNav && (
        <div className={`transition-opacity duration-500 ${overlayVisible ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={() => { scrollToIndex(activeIdx - 1); showOverlay(); }}
            disabled={activeIdx === 0}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full glass-strong flex items-center justify-center disabled:opacity-30 active:scale-90 transition"
          >
            <ChevronUp size={24} className="text-white" />
          </button>
          <button
            onClick={() => { scrollToIndex(activeIdx + 1); showOverlay(); }}
            disabled={activeIdx === items.length - 1}
            className="absolute right-6 bottom-1/2 translate-y-1/2 z-30 w-12 h-12 rounded-full glass-strong flex items-center justify-center disabled:opacity-30 active:scale-90 transition"
          >
            <ChevronDown size={24} className="text-white" />
          </button>
        </div>
      )}

      {/* Top overlay: strip ad (if active reel has one) + feed label + progress */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 safe-top pointer-events-none transition-opacity duration-500 ${overlayVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Floating header - gradient fade, so the reel keeps the full frame */}
        <div className="pointer-events-auto">
          <div className="bg-gradient-to-b from-black/70 to-transparent px-4 sm:px-6 lg:px-8 pt-3 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 no-select">
                <img
                  src="/icons/vallavanicon.webp"
                  width={32}
                  height={32}
                  alt="Vallavan"
                  className="rounded-full object-cover"
                />
                <span className="font-black text-white text-base tracking-wide drop-shadow-lg">VALLAVAN</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onLive}
                  className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition"
                  aria-label="Live TV"
                >
                  <Tv size={18} className="text-white drop-shadow" />
                  <span className="absolute top-1.5 right-1.5 flex">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-vred opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-vred" />
                  </span>
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition">
                  <Cast size={18} className="text-white drop-shadow" />
                </button>
                <button
                  onClick={onNotifications}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition relative"
                  aria-label="Notifications"
                >
                  <Bell size={18} className="text-white drop-shadow" />
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-vred rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    3
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Strip ad at top */}
        {items[activeIdx]?.type === 'reel' && items[activeIdx].stripAd && (
          <StripAdTop ad={items[activeIdx].stripAd!} />
        )}

        {/* Progress bar */}
        <div className="h-0.5 bg-white/10 mx-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-vred rounded-full transition-all duration-300"
            style={{ width: `${items.length ? ((activeIdx + 1) / items.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StripAdTop({ ad }: { ad: AdContent }) {
  return (
    <div className="pointer-events-auto px-3 pt-2 pb-1">
      <div className="rounded-xl glass-strong px-3 py-2 flex items-center gap-2.5">
        <span className="px-1.5 py-0.5 bg-vgold rounded text-[7px] font-black tracking-wider uppercase text-black flex-shrink-0">Ad</span>
        <img src={pexelsUrl(ad.bgImage, 100)} alt={ad.sponsor} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-vgold font-bold">{ad.sponsor}</div>
          <div className="text-[11px] font-semibold text-white truncate">{ad.headline}</div>
        </div>
        <button className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold active:scale-95 transition flex items-center gap-1">
          {ad.cta} <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

function ReelCard({
  reel,
  active,
  overlayVisible,
  muted,
  onToggleMute,
  liked,
  onLike,
  onShared,
  onEnded,
  isLast,
}: {
  reel: FeedReel;
  stripAd?: AdContent;
  active: boolean;
  overlayVisible: boolean;
  muted: boolean;
  onToggleMute: () => void;
  liked: boolean;
  onLike: () => void;
  /** A share that actually left the app — used to increment feed_reels.shares. */
  onShared: () => void;
  /** Playback reached the end; the feed advances to the next item. */
  onEnded: () => void;
  isLast: boolean;
}) {
  const device = useDevice();
  const genreColor = genreColors[reel.genre] || '#666';
  // The count comes from the row itself now; the parent moves it optimistically
  // and reconciles with the database, so nothing is derived from `liked` here.
  const likeCount = reel.likes ?? 0;
  const [sharing, setSharing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const kind = detectVideoKind(reel.videoUrl);
  /** The HTML5 <video> path. YouTube goes through an iframe, which self-plays. */
  const isHtml5 = kind === 'mp4' || kind === 'hls';
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState({ t: 0, d: 0 });
  const [volume, setVolume] = useState(1);

  /**
   * This is what actually makes a Bunny video load.
   *
   * The element used to carry `src={reel.videoUrl}` directly. A Bunny playback
   * URL is an HLS manifest (…/playlist.m3u8), and a bare <video src> only plays
   * HLS on Safari — Chrome, Edge and Firefox have no demuxer for a manifest, so
   * nothing streams and no segment is ever fetched. attachVideo() is the helper
   * VideoPlayerScreen has been using all along: it lazy-imports hls.js and calls
   * loadSource(url) + attachMedia(video), and hls.js is what issues the XHR for
   * playlist.m3u8 and then for every media segment. FeedScreen simply never
   * called it.
   */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active || !isHtml5 || !reel.videoUrl) return;
    return attachVideo(v, reel.videoUrl);
  }, [active, isHtml5, reel.videoUrl]);

  // Mirror the element's real state instead of assuming it: autoplay can be
  // refused, hls.js starts playback asynchronously, and the scrub bar has to
  // follow the media rather than a timer of our own.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => setPlaying(!v.paused);
    const onTime = () => setProgress({ t: v.currentTime, d: Number.isFinite(v.duration) ? v.duration : 0 });
    const onVol = () => { setVolume(v.volume); };
    sync(); onTime(); onVol();
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onTime);
    v.addEventListener('durationchange', onTime);
    v.addEventListener('volumechange', onVol);
    return () => {
      v.removeEventListener('play', sync);
      v.removeEventListener('pause', sync);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onTime);
      v.removeEventListener('durationchange', onTime);
      v.removeEventListener('volumechange', onVol);
    };
  }, [active, isHtml5]);

  /** Scrub. Guarded on a known duration — seeking an unloaded media throws. */
  const seekTo = (seconds: number) => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    v.currentTime = Math.max(0, Math.min(v.duration, seconds));
  };

  /** ±SKIP_SECONDS from wherever playback is now. */
  const skip = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    seekTo(v.currentTime + delta);
  };

  const setVideoVolume = (next: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, next));
    // Dragging the level off zero is an unmute request; muted audio would
    // otherwise make the control look broken.
    if (v.volume > 0 && muted) onToggleMute();
  };

  /**
   * Vertical level track: top of the bar is 1, bottom is 0. Pointer events
   * rather than a range input so a drag works the same under a finger and a
   * mouse, and so the control can be 6px wide without becoming unusable —
   * the whole 56px track is the hit area.
   */
  const volumeFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setVideoVolume(1 - (e.clientY - r.top) / r.height);
  };

  // Autoplay on scroll-into-view; stop and rewind on scroll-away so an
  // off-screen reel never keeps streaming or playing audio.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isHtml5) return;
    if (active) {
      v.play().catch(() => { /* refused until a gesture — the Play button covers that */ });
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [active, isHtml5]);

  /**
   * The overlay tap target. It was wired to onToggleMute, so the Play glyph
   * toggled the sound of a video that had never started — the button could not
   * begin playback under any circumstances.
   */
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) { onToggleMute(); return; }  // image-only reel: keep the old tap behaviour
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  /**
   * Share this reel. Points at seo-site's /feed/{slug}, which server-renders
   * per-reel OpenGraph tags — see services/share.ts. Prefers the OS share
   * sheet, falling back to the WhatsApp/SMS/email menu on browsers without
   * the Web Share API.
   */
  const onShare = async () => {
    const url = shareUrl('reel', shareRef(reel));
    const outcome = await nativeShare(reel.title, url);
    // 'dismissed' means the OS sheet was cancelled — not a share, not counted.
    if (outcome === 'shared') onShared();
    else if (outcome === 'unsupported') setSharing(true);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Full-screen background image (mimicking video) */}
      <div className="absolute inset-0">
        {active && reel.videoUrl && detectVideoKind(reel.videoUrl) === 'youtube' ? (
          <iframe src={youtubeEmbedUrl(reel.videoUrl)} title={reel.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" />
        ) : active && reel.videoUrl && isHtml5 ? (
          // No `src` here on purpose — attachVideo() owns the source, because
          // an HLS manifest has to go through hls.js on every non-Safari browser.
          <video
            ref={videoRef}
            poster={pexelsUrl(reel.thumb, 1080)}
            className="w-full h-full object-cover"
            muted={muted}
            // Only the final reel loops: everywhere else the feed moves on, which
            // is what a vertical short-form feed is expected to do.
            loop={isLast}
            playsInline
            preload="auto"
            onEnded={onEnded}
          />
        ) : (
          <img
            src={pexelsUrl(reel.thumb, 1080)}
            alt={reel.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${active ? 'scale-100' : 'scale-105'}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Tap anywhere to play/pause — the invisible full-frame target. */}
      {active && (
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          tabIndex={-1}
          className="absolute inset-0 z-10"
        />
      )}

      {/* Rewind / play-pause / forward, on the video itself rather than behind
          a menu. Sits above the full-frame target and stops propagation, so a
          skip is not also read as a tap-to-pause. Follows the same auto-hide as
          the rest of the chrome; while paused it stays up regardless, because a
          paused player with no visible way to resume is a dead end. */}
      {active && isHtml5 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute inset-0 z-20 flex items-center justify-center gap-7 pointer-events-none transition-opacity duration-500 ${overlayVisible || !playing ? 'opacity-100' : 'opacity-0'}`}
        >
          <button
            onClick={() => skip(-SKIP_SECONDS)}
            aria-label={`Rewind ${SKIP_SECONDS} seconds`}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/35 backdrop-blur-sm flex flex-col items-center justify-center active:scale-90 transition"
          >
            <RotateCcw size={19} className="text-white" />
            <span className="text-[8px] font-bold text-white leading-none mt-0.5">{SKIP_SECONDS}</span>
          </button>

          <button
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="pointer-events-auto w-16 h-16 rounded-full bg-black/35 backdrop-blur-sm flex items-center justify-center active:scale-90 transition"
          >
            {playing
              ? <Pause size={26} fill="white" className="text-white" />
              : <Play size={28} fill="white" className="text-white ml-1" />}
          </button>

          <button
            onClick={() => skip(SKIP_SECONDS)}
            aria-label={`Forward ${SKIP_SECONDS} seconds`}
            className="pointer-events-auto w-12 h-12 rounded-full bg-black/35 backdrop-blur-sm flex flex-col items-center justify-center active:scale-90 transition"
          >
            <RotateCw size={19} className="text-white" />
            <span className="text-[8px] font-bold text-white leading-none mt-0.5">{SKIP_SECONDS}</span>
          </button>
        </div>
      )}

      {/* Sources without a controllable element (YouTube iframe, poster-only
          reels) keep the original single glyph. */}
      {active && !isHtml5 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>
        </div>
      )}

      {/* Right-edge action icons - auto-hide */}
      <div className={`absolute right-3 feed-rail-safe z-20 flex flex-col items-center gap-5 transition-opacity duration-500 ${overlayVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Views. Read-only, so it is a div rather than a button — it matches
            the like/share stack visually without pretending to be tappable. */}
        <div className="flex flex-col items-center gap-1" title={`${(reel.views ?? 0).toLocaleString('en-IN')} views`}>
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
            <Eye size={22} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow">{formatCount(reel.views ?? 0)}</span>
        </div>
        <button onClick={onLike} className="flex flex-col items-center gap-1 active:scale-90 transition">
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
            <Heart size={22} className={liked ? 'text-vred' : 'text-white'} fill={liked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow">{formatCount(likeCount)}</span>
        </button>
        <button onClick={onShare} aria-label="Share" className="flex flex-col items-center gap-1 active:scale-90 transition">
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
            <Share2 size={22} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow">{formatCount(reel.shares)}</span>
        </button>

        {sharing && (
          <ShareSheet
            title={reel.title}
            url={shareUrl('reel', shareRef(reel))}
            onClose={() => setSharing(false)}
            onShared={onShared}
          />
        )}
        {/* The only volume control in the player. The speaker toggles mute; the
            short vertical track under it sets the level. Deliberately not a
            range input — this column is 48px wide, and a horizontal slider had
            to live somewhere else entirely, which is how the player ended up
            with two competing volume controls. */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-12 h-12 rounded-full glass-strong flex items-center justify-center active:scale-90 transition"
          >
            {muted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
          </button>

          {isHtml5 && (
            <div
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((muted ? 0 : volume) * 100)}
              tabIndex={0}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); volumeFromPointer(e); }}
              onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) volumeFromPointer(e); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); setVideoVolume((muted ? 0 : volume) + 0.1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); setVideoVolume((muted ? 0 : volume) - 0.1); }
              }}
              className="w-1.5 h-14 rounded-full bg-white/25 relative cursor-pointer touch-none"
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-full bg-white transition-[height] duration-75"
                style={{ height: `${Math.round((muted ? 0 : volume) * 100)}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Player controls, wired to the real <video> — scrub, elapsed/total and
          (on pointer devices) a volume slider. Only for the HTML5 path: a
          YouTube iframe exposes none of this. Stops click propagation so the
          full-screen play/pause target above does not swallow a scrub. */}
      {active && isHtml5 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-0 left-0 right-0 z-30 feed-controls-safe px-4 transition-opacity duration-500 ${overlayVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Seek only. Volume lives once, in the right-hand rail. */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-white/80 tabular-nums w-9 text-right drop-shadow">{clock(progress.t)}</span>
            <input
              type="range"
              min={0}
              max={progress.d || 0}
              step={0.1}
              value={Math.min(progress.t, progress.d || 0)}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-label="Seek"
              className="flex-1 h-1 accent-vred cursor-pointer"
            />
            <span className="text-[10px] text-white/80 tabular-nums w-9 drop-shadow">{clock(progress.d)}</span>
          </div>
        </div>
      )}

      {/* Bottom-left: short title only + category tag + duration */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 feed-title-safe px-4 transition-opacity duration-500 ${overlayVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-[78%]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white" style={{ backgroundColor: genreColor }}>
              {reel.contentType}
            </span>
            <span className="text-[10px] text-white/60">{reel.duration}</span>
          </div>
          <h3 className={`text-white font-bold font-tamil drop-shadow leading-tight ${device.isMobile ? 'text-lg' : 'text-xl'}`}>{reel.titleTa || reel.title}</h3>
          <p className="text-white/70 text-xs drop-shadow leading-tight mt-0.5">{reel.title}</p>
        </div>
      </div>
    </div>
  );
}

function BannerReel({ ad }: { ad: AdContent }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="absolute inset-0">
        <img src={pexelsUrl(ad.bgImage, 1080)} alt={ad.sponsor} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
        <span className="px-3 py-1 bg-vgold rounded-full text-[10px] font-black tracking-wider uppercase text-black mb-4">
          Sponsored
        </span>
        <div className="text-center max-w-md">
          <div className="text-sm text-vgold font-bold mb-2">{ad.sponsor}</div>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">{ad.headline}</h2>
          <p className="text-sm text-white/70 mb-6">{ad.body}</p>
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold text-sm active:scale-95 transition">
            {ad.cta} <ArrowRight size={16} />
          </button>
        </div>
        <p className="absolute bottom-8 text-[10px] text-white/40">Swipe to continue</p>
      </div>
    </div>
  );
}
