import { useState, useEffect } from 'react';
import { Play, Volume2, Maximize, Bell, ChevronRight, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { AdSlot } from '@/components/AdSlot';
import { LiveBadge } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { liveSchedule as mockSchedule, ads as mockAds, pexelsUrl, type AdContent, type Documentary, type LiveSlot } from '@/data/mockData';
import { fetchLiveSchedule } from '@/services/live';
import { fetchAds } from '@/services/ads';
import { fetchDocumentaries } from '@/services/documentaries';
import { fetchBroadcastConfig } from '@/services/broadcast';
import { BroadcastOverlay } from '@/components/broadcast/BroadcastOverlay';
import { NowNextPanel, BroadcastStrips } from '@/components/broadcast/BroadcastPanels';
import { useBroadcast } from '@/hooks/useBroadcast';

export function LiveScreen({
  onNotifications,
  onPlay,
  onBack,
}: {
  onNotifications: () => void;
  onPlay: () => void;
  onBack?: () => void;
}) {
  const [schedule, setSchedule] = useState(mockSchedule);
  const [allAds, setAllAds] = useState(mockAds);
  const [docs, setDocs] = useState<Documentary[]>([]);
  const [channelLive, setChannelLive] = useState<boolean | null>(null);

  useEffect(() => {
    fetchLiveSchedule().then(setSchedule);
    fetchAds().then(setAllAds);
    fetchDocumentaries().then(setDocs);
    fetchBroadcastConfig().then((c) => setChannelLive(!!c.channel_live));
  }, []);

  // While the go-live flag loads, and whenever it's off → Coming Soon promo mode.
  if (channelLive !== true) {
    return <ComingSoonLive schedule={schedule} docs={docs} onNotifications={onNotifications} onBack={onBack} loading={channelLive === null} />;
  }

  // --- LIVE mode (channel_live = true) — real player + broadcast overlay ---
  return <LiveNow schedule={schedule} allAds={allAds} onPlay={onPlay} onNotifications={onNotifications} onBack={onBack} />;
}

// ---------------------------------------------------------------------------
// LIVE mode — clean video on mobile, full broadcast overlay from `md:` up.
//
// On phones the picture carries only the LIVE badge, the channel bug and the
// play button; now/next, player controls, weather, ticker and the sponsor ad
// each get their own non-overlapping strip below it. `useBroadcast` is mounted
// here exactly once and feeds both the overlay and the mobile strips — the
// hidden-on-mobile overlay is still mounted, so duplicating the hook would
// duplicate every Realtime subscription.
// ---------------------------------------------------------------------------
function LiveNow({ schedule, allAds, onPlay, onNotifications, onBack }: {
  schedule: LiveSlot[]; allAds: AdContent[]; onPlay: () => void; onNotifications: () => void; onBack?: () => void;
}) {
  const data = useBroadcast(schedule);
  // Prefer the schedule engine's answer over the raw isLive flag, so the hero
  // title, the artwork and the lower-third all name the same program — a stale
  // flag would otherwise caption the picture with a program that already ended.
  const liveNow = data.current ?? schedule.find((s) => s.isLive) ?? schedule[0];
  if (!liveNow) return null;

  return (
    <div>
      <Header title="Live TV" onNotifications={onNotifications} onLive={onBack} notificationCount={3} showCast showSearchIcon={false} showLiveIcon={false} />

      <div className="px-4 sm:px-6 lg:px-8 mt-3 flex items-center gap-2">
        <LiveBadge size="md" />
        <span className="text-xs text-vmuted font-bold">VALLAVAN TV · On Air Now</span>
      </div>

      <section className="mt-3 relative w-full">
        <div className="relative w-full aspect-video lg:aspect-[21/9]">
          <img src={pexelsUrl(liveNow.thumb, 1280)} alt={liveNow.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-vblack via-vblack/40 to-vblack/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-vblack/60 to-transparent" />

          <div className="absolute top-3 left-3 sm:left-6 lg:left-8 z-30 flex items-center gap-2">
            <LiveBadge size="md" />
            <span className="hidden md:inline-block px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white">1.2K Watching</span>
          </div>
          {/* Channel wordmark — desktop only, dropped clear of the program timer.
              Mobile gets the compact channel bug from BroadcastOverlay instead. */}
          <div className="hidden md:block absolute top-12 right-3 z-30 px-2 py-1 bg-vred rounded text-[10px] font-black tracking-wider text-white">VALLAVAN TV</div>

          <button onClick={onPlay} className="absolute inset-0 flex items-center justify-center active:scale-95 transition z-10">
            <div className="w-16 h-16 rounded-full bg-vred/90 flex items-center justify-center shadow-glow"><Play size={28} fill="white" className="text-white ml-1" /></div>
          </button>

          <BroadcastOverlay data={data} />

          {/* Title, progress and controls ride on the picture from `md:` up only. */}
          <div className="hidden md:block absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 safe-bottom z-30">
            <div className="max-w-[560px]">
              <h2 className="text-lg lg:text-xl font-black text-white leading-tight">{liveNow.title}</h2>
              <p className="text-sm font-tamil text-vgold leading-tight">{liveNow.titleTa}</p>
              <p className="text-xs text-vmuted mt-1.5 leading-relaxed line-clamp-2">{liveNow.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold text-vred">LIVE</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden max-w-[300px]"><div className="h-full w-2/3 bg-vred rounded-full" /></div>
                <span className="text-[10px] text-vmuted">22:15 / 45:00</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={onPlay} className="w-[180px] py-2.5 rounded-full bg-vred text-white text-sm font-bold active:scale-95 transition flex items-center justify-center gap-1.5"><Play size={14} fill="currentColor" /> Watch Live</button>
                <button className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90"><Volume2 size={16} className="text-white" /></button>
                <button className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90"><Maximize size={16} className="text-white" /></button>
                <button className="px-4 py-2.5 rounded-full glass text-white text-xs font-bold active:scale-95 transition">Program Guide</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile: now/next caption for the picture, then controls, then the
          weather + ticker strips — one section each, nothing stacked. */}
      <NowNextPanel current={liveNow} next={data.next} />

      <section className="md:hidden px-4 mt-3">
        <div className="flex items-center gap-2">
          <button onClick={onPlay} className="flex-1 h-11 rounded-full bg-vred text-white text-sm font-bold active:scale-95 transition flex items-center justify-center gap-1.5"><Play size={14} fill="currentColor" /> Watch Live</button>
          <button aria-label="Volume" className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90 flex-shrink-0"><Volume2 size={16} className="text-white" /></button>
          <button aria-label="Fullscreen" className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90 flex-shrink-0"><Maximize size={16} className="text-white" /></button>
          <button className="px-3 h-11 rounded-full glass text-white text-xs font-bold active:scale-95 transition flex-shrink-0">Guide</button>
        </div>
      </section>

      <BroadcastStrips data={data} />

      <section className="mt-6 px-4 sm:px-6 lg:px-8"><AdSlot ad={allAds[1]} /></section>

      <ScheduleGrid schedule={schedule} onPlay={onPlay} title="Today's Schedule" titleTa="இன்றைய நிரல்" currentId={data.onAir && data.current ? data.current.id : null} />
      <div className="h-8" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMING SOON promo mode (channel_live = false)
// ---------------------------------------------------------------------------
function ComingSoonLive({ schedule, docs, onNotifications, onBack, loading }: {
  schedule: LiveSlot[]; docs: Documentary[]; onNotifications: () => void; onBack?: () => void; loading: boolean;
}) {
  return (
    <div>
      <Header title="Live TV" onNotifications={onNotifications} onLive={onBack} notificationCount={3} showCast showSearchIcon={false} showLiveIcon={false} />

      {/* Hero: logo + Coming Soon */}
      <section className="relative mt-2 px-4">
        <div className="relative rounded-card overflow-hidden">
          <PromoReel docs={docs} />
          <div className="absolute inset-0 bg-gradient-to-t from-vblack via-vblack/70 to-vblack/40" />
          <div className="relative z-10 flex flex-col items-center text-center px-6 py-12 sm:py-16">
            <div className="drop-shadow-[0_0_30px_rgba(211,47,47,0.45)]"><LogoMark size={72} /></div>
            <span className="mt-4 px-3 py-1 rounded-full bg-vgold text-black text-[10px] font-black tracking-widest uppercase">Launching Soon</span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-black text-white tracking-wide animate-pulse">COMING SOON</h1>
            <p className="mt-2 text-sm sm:text-base text-vmuted max-w-md">24/7 Tamil Documentaries, News, Events &amp; More</p>
            <div className="mt-3 flex items-center gap-2 text-vgold">
              <span className="w-1.5 h-1.5 rounded-full bg-vred animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase">VALLAVAN TV {loading ? '' : '· channel launching'}</span>
            </div>
          </div>
        </div>
      </section>

      <GetNotified />

      {/* Upcoming schedule preview */}
      <ScheduleGrid schedule={schedule} title="Upcoming Schedule Preview" titleTa="வரவிருக்கும் நிரல்" preview />

      <div className="h-8" />
    </div>
  );
}

/** Auto-playing slideshow of documentary posters (fade crossfade). */
function PromoReel({ docs }: { docs: Documentary[] }) {
  const posters = (docs.length ? docs : []).map((d) => d.poster);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (posters.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % posters.length), 2500);
    return () => clearInterval(t);
  }, [posters.length]);

  if (posters.length === 0) {
    return <div className="w-full aspect-[16/10] sm:aspect-[21/9] bg-gradient-to-br from-vred/20 via-vblack to-vblack" />;
  }
  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] bg-vblack">
      {posters.map((p, i) => (
        <img
          key={i}
          src={pexelsUrl(p, 1280)}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === idx ? 'opacity-70' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
}

const NOTIFY_KEY = 'vallavan_livetv_notify';

function GetNotified() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState<boolean>(() => {
    try { return !!localStorage.getItem(NOTIFY_KEY); } catch { return false; }
  });

  const save = () => {
    if (!email.includes('@')) return;
    try { localStorage.setItem(NOTIFY_KEY, JSON.stringify({ email, ts: Date.now() })); } catch { /* ignore */ }
    setDone(true);
  };

  return (
    <section className="px-4 mt-5">
      <div className="p-4 rounded-card glass-strong">
        {done ? (
          <div className="flex items-center gap-2 text-green-400">
            <Check size={18} />
            <span className="text-sm font-bold">You're on the list — we'll notify you at launch!</span>
          </div>
        ) : (
          <>
            <div className="text-sm font-black text-white">Get notified when we go live</div>
            <div className="text-[11px] text-vmuted mb-3">Be the first to watch VALLAVAN TV.</div>
            <div className="flex gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com"
                className="flex-1 px-4 py-3 rounded-full glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
              <button onClick={save} disabled={!email.includes('@')} className="px-5 py-3 rounded-full bg-vred text-white text-sm font-bold active:scale-95 disabled:opacity-40">Get Notified</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ScheduleGrid({ schedule, onPlay, title, titleTa, preview, currentId = null }: {
  schedule: LiveSlot[]; onPlay?: () => void; title: string; titleTa: string; preview?: boolean;
  /** Id of the slot actually on air, from the schedule engine. null = nothing on air. */
  currentId?: string | null;
}) {
  return (
    <section className="mt-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base lg:text-lg font-black text-white">{title}</h2>
          <p className="text-[11px] font-tamil text-vmuted">{titleTa}</p>
        </div>
        {!preview && <button className="flex items-center gap-0.5 text-[11px] lg:text-xs font-semibold text-vred active:scale-95">Full Guide <ChevronRight size={14} /></button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {schedule.map((slot) => {
          // Highlight what the engine says is on air, not the raw isLive flag —
          // a stale flag would badge a program that finished hours ago.
          const isNow = !preview && !!currentId && slot.id === currentId;
          return (
          <div key={slot.id} className={`flex items-center gap-3 p-2.5 rounded-card transition ${isNow ? 'glass-strong border-l-2 border-vred' : 'glass'}`}>
            <div className="relative w-16 h-11 rounded-lg overflow-hidden flex-shrink-0">
              <img src={pexelsUrl(slot.thumb, 200)} alt={slot.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white">{slot.time}</span>
                {isNow ? <LiveBadge /> : <span className="text-[9px] text-vmuted px-1.5 py-0.5 rounded bg-white/5">{slot.duration}</span>}
              </div>
              <div className="text-sm font-bold text-white truncate mt-0.5">{slot.title}</div>
              <div className="text-[11px] font-tamil text-vmuted truncate">{slot.titleTa}</div>
            </div>
            {preview ? (
              <span className="px-2 py-1 rounded-full bg-vgold/15 text-vgold text-[9px] font-black uppercase">Soon</span>
            ) : isNow ? (
              <button onClick={onPlay} className="px-3 py-1.5 rounded-full bg-vred text-white text-[11px] font-bold active:scale-90 transition">Watch</button>
            ) : (
              <button className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90 transition"><Bell size={15} className="text-vmuted" /></button>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
