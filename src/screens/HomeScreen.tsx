import { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { SectionRow, LiveBadge } from '@/components/ui';
import { ContentCard, ContinueWatchingCard } from '@/components/ContentCard';
import { AdSlot } from '@/components/AdSlot';
import {
  documentaries as mockDocuments,
  liveSchedule as mockSchedule,
  genreColors,
  pexelsUrl,
  type Documentary,
  type AdContent,
} from '@/data/mockData';
import { fetchDocumentaries } from '@/services/documentaries';
import { fetchAds } from '@/services/ads';
import { fetchLiveSchedule } from '@/services/live';

export function HomeScreen({
  onSearch,
  onNotifications,
  onCardClick,
  onPlay,
  onSeeAll,
  onWatchLive,
  onLive,
}: {
  onSearch: () => void;
  onNotifications: () => void;
  onCardClick: (d: Documentary) => void;
  onPlay: (d: Documentary) => void;
  onSeeAll: (row: string) => void;
  onWatchLive: () => void;
  onLive: () => void;
}) {
  const [allDocs, setAllDocs] = useState(mockDocuments);
  const [allAds, setAllAds] = useState<AdContent[]>([]);
  const [schedule, setSchedule] = useState(mockSchedule);

  useEffect(() => {
    fetchDocumentaries().then(setAllDocs);
    fetchAds().then(setAllAds);
    fetchLiveSchedule().then(setSchedule);
  }, []);

  const featured = allDocs.slice(0, 3);
  const popular = allDocs.slice(2, 7);
  const newReleases = allDocs.filter((d) => d.badge === 'NEW');
  const continueWatching = allDocs.filter((d) => d.progress != null);
  const liveNow = schedule.find((s) => s.isLive)!;

  const [heroIdx, setHeroIdx] = useState(0);

  // Auto-slide the hero carousel every 5s.
  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  const hero = featured[heroIdx % Math.max(1, featured.length)];

  return (
    <div>
      <Header onSearch={onSearch} onNotifications={onNotifications} onLive={onLive} notificationCount={3} />

      {/* Featured Hero — full-bleed */}
      <HeroBanner
        hero={{
          id: hero.id,
          title: hero.title,
          titleTa: hero.titleTa,
          genre: hero.genre,
          genreColor: genreColors[hero.genre],
          duration: hero.duration,
          synopsis: hero.synopsis,
          badge: 'FEATURED',
          backdrop: pexelsUrl(hero.backdrop, 1280),
        }}
        onWatch={() => onPlay(hero)}
        dots={featured.length}
        dotIdx={heroIdx}
        onDotClick={setHeroIdx}
      />

      {/* Sponsored Banner 1 */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8">
        <AdSlot ad={allAds[0]} />
      </section>

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <SectionRow title="Continue Watching" titleTa="தொடர்ந்து பார்க்க" onAction={() => onSeeAll('continue')}>
          {continueWatching.map((d) => (
            <ContinueWatchingCard key={d.id} item={d} onClick={() => onCardClick(d)} />
          ))}
        </SectionRow>
      )}

      {/* Popular */}
      <SectionRow title="Popular Documentaries" titleTa="பிரபலமான ஆவணப்படங்கள்" onAction={() => onSeeAll('popular')}>
        {popular.map((d) => (
          <ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />
        ))}
        <AdSlot ad={allAds[1]} variant="native" />
      </SectionRow>

      {/* New Releases */}
      <SectionRow title="New Releases" titleTa="புதிய வெளியீடுகள்" onAction={() => onSeeAll('new')}>
        {newReleases.map((d) => (
          <ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />
        ))}
      </SectionRow>

      {/* Sponsored Banner 2 */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8">
        <AdSlot ad={allAds[2]} />
      </section>

      {/* Live Now Strip */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base lg:text-lg font-black text-white">Live Now</h2>
          <button onClick={onWatchLive} className="flex items-center gap-1 text-[11px] lg:text-xs font-semibold text-vred active:scale-95">
            Watch Live <Radio size={12} />
          </button>
        </div>
        <button onClick={onWatchLive} className="w-full flex items-center gap-3 p-3 rounded-card glass-strong active:scale-[0.98] transition text-left">
          <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img src={pexelsUrl(liveNow.thumb, 200)} alt={liveNow.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <LiveBadge />
              <span className="text-[10px] text-vmuted font-bold">VALLAVAN TV</span>
            </div>
            <div className="text-sm font-bold text-white truncate">{liveNow.title}</div>
            <div className="text-[11px] font-tamil text-vmuted truncate">{liveNow.titleTa}</div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-vred text-white text-[11px] font-bold active:scale-90 transition">Watch</div>
        </button>
      </section>

      {/* Editor's Choice */}
      <SectionRow title="Editor's Choice" titleTa="சிறப்புத் தேர்வு" onAction={() => onSeeAll('editor')}>
        {allDocs.filter((d) => d.exclusive).map((d) => (
          <ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />
        ))}
      </SectionRow>

      <div className="h-8" />
    </div>
  );
}
