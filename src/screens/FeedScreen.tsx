import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Heart, MessageCircle, Share2, Volume2, VolumeX,
  ChevronUp, ChevronDown, Play, ArrowRight,
} from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import {
  feedReels as mockFeedReels,
  ads as mockAds,
  genreColors,
  pexelsUrl,
  type FeedReel,
  type AdContent,
} from '@/data/mockData';
import { fetchFeedReels } from '@/services/feed';
import { fetchAds } from '@/services/ads';
import { detectVideoKind, youtubeEmbedUrl } from '@/lib/video-player';

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

function buildFeedSequence(feedReels: FeedReel[], ads: AdContent[]): Item[] {
  const items: Item[] = [];
  const sorted = [...feedReels].sort((a, b) => a.order - b.order);

  sorted.forEach((reel, idx) => {
    // Strip ad between every 3 reels (or where admin flagged the reel).
    const hasStrip = reel.stripAdHost || (idx > 0 && (idx + 1) % 3 === 0);
    const stripAd = hasStrip && ads.length ? ads[idx % ads.length] : undefined;

    items.push({ type: 'reel', reel, stripAd });

    // Banner interstitial after every 5 reels (or where admin flagged).
    if ((reel.bannerAfter || ((idx + 1) % 5 === 0 && idx > 0)) && ads.length) {
      items.push({ type: 'banner', ad: ads[(idx + 2) % ads.length] });
    }
  });

  return items;
}

const FEED_CATEGORIES = ['All', 'News', 'Teaser', 'Short Story', 'Entertainment', 'Sports'];

const formatCount = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
};

export function FeedScreen({
  onBack,
}: {
  onBack?: () => void;
}) {
  const device = useDevice();
  const [rawReels, setRawReels] = useState<FeedReel[]>(mockFeedReels);
  const [allAds, setAllAds] = useState<AdContent[]>(mockAds);
  const [category, setCategory] = useState<string>('All');
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    Promise.all([fetchFeedReels(), fetchAds()]).then(([reels, adList]) => {
      setRawReels(reels);
      setAllAds(adList);
    });
  }, []);

  const filteredReels = category === 'All' ? rawReels : rawReels.filter((r) => r.contentType === category);
  const items = buildFeedSequence(filteredReels, allAds);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    itemRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth' });
    setActiveIdx(clamped);
  }, [items.length]);

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

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Height: full viewport minus bottom nav (mobile/tablet) or side rail offset (desktop/TV)
  const isSideNav = device.isDesktop || device.isTV;

  return (
    <div
      className={`fixed inset-0 z-40 bg-black ${isSideNav ? 'lg:pl-20 xl:pl-60' : ''}`}
    >
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollTop / el.clientHeight);
          if (idx !== activeIdx) setActiveIdx(idx);
        }}
      >
        {items.length === 0 && (
          <div className="h-full w-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-white font-bold">Nothing in {category} yet</p>
            <p className="text-xs text-vmuted mt-1">Try another category.</p>
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
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                liked={liked.has(item.reel.id)}
                onLike={() => toggleLike(item.reel.id)}
              />
            ) : (
              <BannerReel ad={item.ad} />
            )}
          </div>
        ))}
      </div>

      {/* Desktop/TV: on-screen up/down chevrons */}
      {isSideNav && (
        <>
          <button
            onClick={() => scrollToIndex(activeIdx - 1)}
            disabled={activeIdx === 0}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full glass-strong flex items-center justify-center disabled:opacity-30 active:scale-90 transition"
          >
            <ChevronUp size={24} className="text-white" />
          </button>
          <button
            onClick={() => scrollToIndex(activeIdx + 1)}
            disabled={activeIdx === items.length - 1}
            className="absolute right-6 bottom-1/2 translate-y-1/2 z-30 w-12 h-12 rounded-full glass-strong flex items-center justify-center disabled:opacity-30 active:scale-90 transition"
          >
            <ChevronDown size={24} className="text-white" />
          </button>
        </>
      )}

      {/* Top overlay: strip ad (if active reel has one) + feed label + progress */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top pointer-events-none">
        {/* Strip ad at top */}
        {items[activeIdx]?.type === 'reel' && items[activeIdx].stripAd && (
          <StripAdTop ad={items[activeIdx].stripAd!} />
        )}
        {items[activeIdx]?.type === 'banner' && (
          <StripAdTop ad={allAds[activeIdx % allAds.length]} />
        )}

        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-black text-white drop-shadow-lg">Feed</h2>
          {onBack && (
            <button onClick={onBack} className="pointer-events-auto w-9 h-9 rounded-full glass-strong flex items-center justify-center active:scale-90 transition">
              <span className="text-white text-xs font-bold">✕</span>
            </button>
          )}
        </div>
        {/* Category chips */}
        <div className="pointer-events-auto hscroll flex gap-2 px-4 pb-2">
          {FEED_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setActiveIdx(0); containerRef.current?.scrollTo({ top: 0 }); }}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-bold transition active:scale-95 ${category === c ? 'bg-vred text-white' : 'bg-black/40 text-white/70'}`}
            >
              {c}
            </button>
          ))}
        </div>

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
  muted,
  onToggleMute,
  liked,
  onLike,
}: {
  reel: FeedReel;
  stripAd?: AdContent;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
  liked: boolean;
  onLike: () => void;
}) {
  const device = useDevice();
  const genreColor = genreColors[reel.genre] || '#666';
  const likeCount = reel.likes + (liked ? 1 : 0);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Full-screen background image (mimicking video) */}
      <div className="absolute inset-0">
        {active && reel.videoUrl && detectVideoKind(reel.videoUrl) === 'youtube' ? (
          <iframe src={youtubeEmbedUrl(reel.videoUrl)} title={reel.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" />
        ) : active && reel.videoUrl && (detectVideoKind(reel.videoUrl) === 'mp4' || detectVideoKind(reel.videoUrl) === 'hls') ? (
          <video src={reel.videoUrl} className="w-full h-full object-cover" autoPlay muted={muted} loop playsInline />
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

      {/* Play indicator (since we use image, not video) */}
      {active && (
        <button
          onClick={onToggleMute}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center active:scale-90 transition">
            <Play size={28} fill="white" className="text-white ml-1" />
          </div>
        </button>
      )}

      {/* Right-edge action icons */}
      <div className="absolute right-3 bottom-32 sm:bottom-28 z-20 flex flex-col items-center gap-5">
        <button onClick={onLike} className="flex flex-col items-center gap-1 active:scale-90 transition">
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
            <Heart size={22} className={liked ? 'text-vred' : 'text-white'} fill={liked ? 'currentColor' : 'none'} />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow">{formatCount(likeCount)}</span>
        </button>
        <button className="flex flex-col items-center gap-1 active:scale-90 transition">
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
            <MessageCircle size={22} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow">{formatCount(reel.comments)}</span>
        </button>
        <button className="flex flex-col items-center gap-1 active:scale-90 transition">
          <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
            <Share2 size={22} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-white drop-shadow">{formatCount(reel.shares)}</span>
        </button>
        <button onClick={onToggleMute} className="w-12 h-12 rounded-full glass-strong flex items-center justify-center active:scale-90 transition">
          {muted ? <VolumeX size={20} className="text-white" /> : <Volume2 size={20} className="text-white" />}
        </button>
      </div>

      {/* Bottom-left: short title only + category tag + duration */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-20 px-4">
        <div className="max-w-[70%]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase text-white" style={{ backgroundColor: genreColor }}>
              {reel.contentType}
            </span>
            <span className="text-[10px] text-white/60">{reel.duration}</span>
          </div>
          <h3 className={`text-white font-bold drop-shadow leading-tight ${device.isMobile ? 'text-base' : 'text-lg'}`}>{reel.title}</h3>
          <p className="text-vgold font-tamil text-sm drop-shadow leading-tight mt-0.5">{reel.titleTa}</p>
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
