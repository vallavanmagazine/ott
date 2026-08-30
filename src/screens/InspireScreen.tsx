import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroBanner } from '@/components/HeroBanner';
import { SectionRow, Chip } from '@/components/ui';
import { AdSlot } from '@/components/AdSlot';
import {
  inspireItems as mockInspire,
  inspireCategories,
  genreColors,
  pexelsUrl,
  type InspireItem,
  type AdContent,
} from '@/data/mockData';
import { fetchInspireItems } from '@/services/inspire';
import { fetchAds } from '@/services/ads';
import { Play } from 'lucide-react';
import { useDevice } from '@/hooks/useDevice';
import { useCategoryNames } from '@/hooks/useCategories';

export function InspireScreen({
  onNotifications,
  onCardClick,
  onLive,
}: {
  onNotifications: () => void;
  onCardClick: (item: InspireItem) => void;
  onLive: () => void;
}) {
  const [activeCat, setActiveCat] = useState('All');
  const dbCats = useCategoryNames('inspire', []);
  const categoryList = dbCats.length ? ['All', ...dbCats] : inspireCategories;
  const [heroIdx, setHeroIdx] = useState(0);
  const [items, setItems] = useState(mockInspire);
  const [allAds, setAllAds] = useState<AdContent[]>([]);

  useEffect(() => {
    fetchInspireItems().then(setItems);
    fetchAds().then(setAllAds);
  }, []);

  const filtered = activeCat === 'All' ? items : items.filter((i) => i.category === activeCat);
  const featured = filtered.slice(0, 3);
  const hero = featured[heroIdx] || filtered[0];

  const inspiringLives = filtered.filter((i) => ['Changemakers', 'Life Lessons', 'Success Stories'].includes(i.category));
  const dailyDose = filtered.filter((i) => i.category === 'Motivation' || i.quote);
  const youngFearless = filtered.filter((i) => i.category === 'Youth Voices');

  return (
    <div>
      <Header title="Inspire" subtitle="Stories that move you. Ideas that inspire change." onNotifications={onNotifications} onLive={onLive} notificationCount={3} />

      {/* Category chips */}
      <section className="mt-4">
        <div className="hscroll flex gap-2 px-4 sm:px-6 lg:px-8 pb-1">
          {categoryList.map((c) => (<Chip key={c} label={c} active={activeCat === c} onClick={() => setActiveCat(c)} />))}
        </div>
      </section>

      {/* Full-bleed hero */}
      {hero && (
        <HeroBanner
          hero={{
            id: hero.id,
            title: hero.title,
            titleTa: hero.titleTa,
            genre: hero.category,
            genreColor: genreColors[hero.category],
            duration: hero.duration,
            quote: hero.quote,
            badge: hero.badge || 'FEATURED',
            backdrop: pexelsUrl(hero.poster, 1280),
          }}
          onWatch={() => onCardClick(hero)}
          dots={featured.length}
          dotIdx={heroIdx}
          onDotClick={setHeroIdx}
        />
      )}

      {/* Sponsored */}
      <section className="mt-6 px-4 sm:px-6 lg:px-8"><AdSlot ad={allAds[2]} /></section>

      {/* Inspiring Lives */}
      {inspiringLives.length > 0 && (
        <SectionRow title="Inspiring Lives" titleTa="ஊக்கமூட்டும் வாழ்க்கை">
          {inspiringLives.map((item) => (<InspireCard key={item.id} item={item} onClick={() => onCardClick(item)} />))}
        </SectionRow>
      )}

      {/* Daily Dose */}
      {dailyDose.length > 0 && (
        <section className="mt-6">
          <div className="px-4 sm:px-6 lg:px-8 mb-3">
            <h2 className="text-base lg:text-lg font-black text-white">Daily Dose of Inspiration</h2>
            <p className="text-[11px] font-tamil text-vmuted">தினசரி ஊக்கம்</p>
          </div>
          <div className="hscroll flex gap-3 px-4 sm:px-6 lg:px-8 pb-1">
            {dailyDose.map((item) => (<QuoteCard key={item.id} item={item} onClick={() => onCardClick(item)} />))}
          </div>
        </section>
      )}

      {/* Young & Fearless */}
      {youngFearless.length > 0 && (
        <SectionRow title="Young & Fearless" titleTa="இளைஞர் துணிவு">
          {youngFearless.map((item) => (<InspireCard key={item.id} item={item} onClick={() => onCardClick(item)} />))}
        </SectionRow>
      )}

      <div className="h-8" />
    </div>
  );
}

function InspireCard({ item, onClick }: { item: InspireItem; onClick: () => void }) {
  const device = useDevice();
  const w = device.isMobile ? 'w-[230px]' : 'w-full max-w-[280px]';
  return (
    <button onClick={onClick} className={`group relative ${w} flex-shrink-0 text-left no-select`}>
      <div className="relative aspect-video rounded-card overflow-hidden bg-white/5 card-shadow border border-white/8">
        <img src={pexelsUrl(item.poster, 400)} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-active:scale-95 transition duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-semibold text-white">{item.duration}</div>
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white" style={{ backgroundColor: genreColors[item.category] || '#666' }}>{item.category}</div>
        {item.badge && <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-vgold rounded text-[8px] font-black uppercase text-black">{item.badge}</div>}
      </div>
      <div className="mt-2 px-0.5">
        <div className="text-[14px] font-bold text-white font-tamil leading-tight line-clamp-1">{item.titleTa || item.title}</div>
        <div className="text-[11px] text-vmuted leading-tight line-clamp-1">{item.title}</div>
      </div>
    </button>
  );
}

function QuoteCard({ item, onClick }: { item: InspireItem; onClick: () => void }) {
  const device = useDevice();
  const w = device.isMobile ? 'w-[230px]' : 'w-full max-w-[280px]';
  return (
    <button onClick={onClick} className={`group relative ${w} flex-shrink-0 text-left no-select`}>
      <div className="relative aspect-square rounded-card overflow-hidden bg-white/5 card-shadow border border-white/8">
        <img src={pexelsUrl(item.poster, 400)} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-50 group-active:scale-95 transition" />
        <div className="absolute inset-0 bg-gradient-to-b from-vblack/60 via-vblack/40 to-vblack/90" />
        <div className="absolute top-3 left-3 text-4xl text-vgold/60 font-serif leading-none">"</div>
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <p className="text-sm font-bold text-white leading-snug line-clamp-4">{item.quote}</p>
          <p className="text-[11px] text-vgold mt-2 font-semibold">— {item.attribution}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-8 h-8 rounded-full bg-vred flex items-center justify-center active:scale-90 transition">
              <Play size={12} fill="white" className="text-white ml-0.5" />
            </div>
            <span className="text-[10px] text-vmuted">{item.duration}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
