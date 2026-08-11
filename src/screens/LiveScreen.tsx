import { Play, Volume2, Maximize, Bell, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { AdSlot } from '@/components/AdSlot';
import { LiveBadge } from '@/components/ui';
import { liveSchedule, ads, pexelsUrl } from '@/data/mockData';

export function LiveScreen({
  onNotifications,
  onPlay,
  onBack,
}: {
  onNotifications: () => void;
  onPlay: () => void;
  onBack?: () => void;
}) {
  const liveNow = liveSchedule.find((s) => s.isLive)!;

  return (
    <div>
      <Header title="Live TV" onNotifications={onNotifications} onLive={onBack} notificationCount={3} showCast showSearchIcon={false} showLiveIcon={false} />

      <div className="px-4 sm:px-6 lg:px-8 mt-3 flex items-center gap-2">
        <LiveBadge size="md" />
        <span className="text-xs text-vmuted font-bold">VALLAVAN TV · On Air Now</span>
      </div>

      {/* Full-bleed live hero */}
      <section className="mt-3 relative w-full">
        <div className="relative w-full aspect-video lg:aspect-[21/9]">
          <img src={pexelsUrl(liveNow.thumb, 1280)} alt={liveNow.title} className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-vblack via-vblack/40 to-vblack/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-vblack/60 to-transparent" />

          <div className="absolute top-3 left-3 sm:left-6 lg:left-8 flex items-center gap-2">
            <LiveBadge size="md" />
            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white">1.2K Watching</span>
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-vred rounded text-[10px] font-black tracking-wider text-white">VALLAVAN TV</div>

          <button onClick={onPlay} className="absolute inset-0 flex items-center justify-center active:scale-95 transition">
            <div className="w-16 h-16 rounded-full bg-vred/90 flex items-center justify-center shadow-glow">
              <Play size={28} fill="white" className="text-white ml-1" />
            </div>
          </button>

          {/* Bottom: now-playing + controls */}
          <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 safe-bottom">
            <div className="max-w-[560px]">
              <h2 className="text-lg lg:text-xl font-black text-white leading-tight">{liveNow.title}</h2>
              <p className="text-sm font-tamil text-vgold leading-tight">{liveNow.titleTa}</p>
              <p className="text-xs text-vmuted mt-1.5 leading-relaxed line-clamp-2">{liveNow.description}</p>

              {/* Live scrubber */}
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[10px] font-bold text-vred">LIVE</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden max-w-[300px]">
                  <div className="h-full w-2/3 bg-vred rounded-full" />
                </div>
                <span className="text-[10px] text-vmuted">22:15 / 45:00</span>
              </div>

              {/* Compact buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button onClick={onPlay} className="w-[180px] py-2.5 rounded-full bg-vred text-white text-sm font-bold active:scale-95 transition flex items-center justify-center gap-1.5">
                  <Play size={14} fill="currentColor" /> Watch Live
                </button>
                <button className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90"><Volume2 size={16} className="text-white" /></button>
                <button className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90"><Maximize size={16} className="text-white" /></button>
                <button className="px-4 py-2.5 rounded-full glass text-white text-xs font-bold active:scale-95 transition">Program Guide</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsored Banner */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8"><AdSlot ad={ads[1]} /></section>

      {/* Today's Schedule */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base lg:text-lg font-black text-white">Today's Schedule</h2>
            <p className="text-[11px] font-tamil text-vmuted">இன்றைய நிரல்</p>
          </div>
          <button className="flex items-center gap-0.5 text-[11px] lg:text-xs font-semibold text-vred active:scale-95">Full Guide <ChevronRight size={14} /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {liveSchedule.map((slot) => (
            <div key={slot.id} className={`flex items-center gap-3 p-2.5 rounded-card transition ${slot.isLive ? 'glass-strong border-l-2 border-vred' : 'glass'}`}>
              <div className="relative w-16 h-11 rounded-lg overflow-hidden flex-shrink-0">
                <img src={pexelsUrl(slot.thumb, 200)} alt={slot.title} className="w-full h-full object-cover" />
                {slot.isLive && <div className="absolute inset-0 ring-2 ring-vred rounded-lg" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-white">{slot.time}</span>
                  {slot.isLive ? <LiveBadge /> : <span className="text-[9px] text-vmuted px-1.5 py-0.5 rounded bg-white/5">{slot.duration}</span>}
                </div>
                <div className="text-sm font-bold text-white truncate mt-0.5">{slot.title}</div>
                <div className="text-[11px] font-tamil text-vmuted truncate">{slot.titleTa}</div>
              </div>
              {slot.isLive ? (
                <button onClick={onPlay} className="px-3 py-1.5 rounded-full bg-vred text-white text-[11px] font-bold active:scale-90 transition">Watch</button>
              ) : (
                <button className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90 transition"><Bell size={15} className="text-vmuted" /></button>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}
