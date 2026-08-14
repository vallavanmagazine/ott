import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { SectionRow, Chip } from '@/components/ui';
import { ContentCard } from '@/components/ContentCard';
import { AdSlot } from '@/components/AdSlot';
import {
  documentaries as mockDocuments,
  ads as mockAds,
  genres,
  genreColors,
  pexelsUrl,
  type Documentary,
} from '@/data/mockData';
import { fetchDocumentaries } from '@/services/documentaries';
import { fetchAds } from '@/services/ads';
import { useCategoryNames } from '@/hooks/useCategories';

export function ExploreScreen({
  onSearch,
  onNotifications,
  onCardClick,
  onSeeAll,
  onLive,
}: {
  onSearch: () => void;
  onNotifications: () => void;
  onCardClick: (d: Documentary) => void;
  onSeeAll: (row: string) => void;
  onLive: () => void;
}) {
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [allDocs, setAllDocs] = useState(mockDocuments);
  const [allAds, setAllAds] = useState(mockAds);

  useEffect(() => {
    fetchDocumentaries().then(setAllDocs);
    fetchAds().then(setAllAds);
  }, []);

  const filtered = activeGenre === 'All'
    ? allDocs
    : allDocs.filter((d) => d.genre === activeGenre);

  const trending = filtered.slice(0, 5);
  const latest = filtered.filter((d) => d.badge === 'NEW');
  const editors = filtered.filter((d) => d.exclusive);
  const investigation = filtered.filter((d) => d.genre === 'Investigation');
  const education = filtered.filter((d) => d.genre === 'Education');
  const categoryNames = useCategoryNames('explore', genres);
  const allChips = ['All', ...categoryNames];

  const heroDoc = allDocs[2];

  return (
    <div>
      <Header onSearch={onSearch} onNotifications={onNotifications} onLive={onLive} notificationCount={3} />

      {/* Full-bleed co-branded hero */}
      <HeroBanner
        hero={{
          id: 'explore-hero',
          title: 'Culture & Heritage Collection',
          titleTa: 'பண்பாடு மற்றும் பாரம்பரியம்',
          synopsis: 'Explore Tamil Nadu\'s rich cultural legacy through curated documentaries.',
          backdrop: pexelsUrl(heroDoc.backdrop, 1280),
        }}
        onWatch={() => onCardClick(heroDoc)}
      />

      {/* Category filter chips */}
      <section className="mt-4">
        <div className="hscroll flex gap-2 px-4 sm:px-6 lg:px-8 pb-1">
          {allChips.map((g) => (
            <Chip key={g} label={g} active={activeGenre === g} onClick={() => setActiveGenre(g)} color={g !== 'All' ? genreColors[g] : undefined} />
          ))}
        </div>
      </section>

      {/* Trending This Week */}
      {trending.length > 0 && (
        <SectionRow title="Trending This Week" titleTa="இந்த வாரம் டிரெண்டிங்" onAction={() => onSeeAll('trending')}>
          {trending.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
          <AdSlot ad={allAds[3]} variant="native" />
        </SectionRow>
      )}

      {/* Latest */}
      {latest.length > 0 && (
        <SectionRow title="Latest Documentaries" titleTa="புதிய ஆவணப்படங்கள்" onAction={() => onSeeAll('latest')}>
          {latest.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
        </SectionRow>
      )}

      {/* Editor's Choice */}
      {editors.length > 0 && (
        <SectionRow title="Editor's Choice" titleTa="சிறப்புத் தேர்வு" onAction={() => onSeeAll('editor')}>
          {editors.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
        </SectionRow>
      )}

      {/* Sponsored Banner */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8"><AdSlot ad={allAds[1]} /></section>

      {/* Investigation */}
      {investigation.length > 0 && (
        <SectionRow title="Investigation" titleTa="விசாரணை" onAction={() => onSeeAll('investigation')}>
          {investigation.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
        </SectionRow>
      )}

      {/* Education */}
      {education.length > 0 && (
        <SectionRow title="Education" titleTa="கல்வி" onAction={() => onSeeAll('education')}>
          {education.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
        </SectionRow>
      )}

      {/* Remaining genre rows */}
      {genres.filter((g) => g !== 'Investigation' && g !== 'Education').map((g) => {
        const items = filtered.filter((d) => d.genre === g);
        if (items.length === 0) return null;
        return (
          <SectionRow key={g} title={g} onAction={() => onSeeAll(g)}>
            {items.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
          </SectionRow>
        );
      })}

      <div className="h-8" />
    </div>
  );
}
