import { Play, Plus, Check, Share2, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ContentCard } from '@/components/ContentCard';
import { SectionRow } from '@/components/ui';
import { genreColors, documentaries as mockDocuments, pexelsUrl, type Documentary } from '@/data/mockData';
import { fetchDocumentaries } from '@/services/documentaries';
import { useDevice } from '@/hooks/useDevice';

export function DocumentaryDetailScreen({
  item,
  onBack,
  onPlay,
  onCardClick,
}: {
  item: Documentary;
  onBack: () => void;
  onPlay: (item: Documentary) => void;
  onCardClick: (d: Documentary) => void;
}) {
  const [added, setAdded] = useState(false);
  const [allDocs, setAllDocs] = useState(mockDocuments);
  const device = useDevice();

  useEffect(() => {
    fetchDocumentaries().then(setAllDocs);
  }, []);

  const genreColor = genreColors[item.genre] || '#666';
  const related = allDocs.filter((d) => d.genre === item.genre && d.id !== item.id).slice(0, 5);
  const moreLikeThis = related.length > 0 ? related : allDocs.filter((d) => d.id !== item.id).slice(0, 5);

  return (
    <div className="min-h-screen bg-vblack text-white">
      {/* Back/share overlay — responsive, no max-w */}
      <div className="fixed top-0 left-0 right-0 z-30 safe-top pointer-events-none">
        <div className="flex items-center justify-between p-4 lg:pl-24 xl:pl-64 pointer-events-auto">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm active:scale-90 transition">
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm active:scale-90 transition">
            <Share2 size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Full-bleed hero backdrop */}
      <div className={`relative w-full ${device.isMobile ? 'aspect-[3/4] max-h-[440px]' : 'aspect-[21/9] lg:aspect-[16/7]'}`}>
        <img src={pexelsUrl(item.backdrop, 1280)} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-vblack via-vblack/30 to-vblack/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-vblack/70 to-transparent" />

        <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 lg:pl-24 xl:pl-64 safe-bottom">
          <div className="max-w-[560px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white" style={{ backgroundColor: genreColor }}>{item.genre}</span>
              {item.exclusive && <span className="px-2 py-0.5 bg-vgold rounded text-[10px] font-black uppercase text-black">Exclusive</span>}
            </div>
            <h1 className={`${device.isMobile ? 'text-2xl' : 'text-3xl lg:text-4xl'} font-black text-white leading-tight`}>{item.title}</h1>
            <p className="text-base lg:text-lg font-tamil text-vgold leading-tight mt-0.5">{item.titleTa}</p>
          </div>
        </div>
      </div>

      {/* Metadata + actions */}
      <div className="px-4 sm:px-6 lg:px-8 lg:pl-24 xl:pl-64 mt-4">
        <div className="max-w-[640px]">
          <div className="flex items-center gap-3 text-[11px] text-vmuted">
            <span className="font-semibold">{item.duration}</span><span>·</span>
            <span>{item.year}</span><span>·</span>
            <span>{item.language}</span><span>·</span>
            <span>HD</span>
          </div>

          {/* Compact buttons */}
          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => onPlay(item)} className="w-[180px] sm:w-[200px] py-3 rounded-full bg-vred text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition shadow-glow">
              <Play size={16} fill="currentColor" /> Watch Now
            </button>
            <button onClick={() => setAdded((v) => !v)} className="w-12 h-12 rounded-full glass text-white font-bold flex items-center justify-center active:scale-95 transition flex-shrink-0">
              {added ? <Check size={16} className="text-vgold" /> : <Plus size={16} />}
            </button>
          </div>

          {/* Synopsis */}
          <div className="mt-5">
            <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2">Synopsis</h3>
            <p className="text-sm text-white/90 leading-relaxed">{item.synopsis}</p>
            <p className="text-sm font-tamil text-vmuted leading-relaxed mt-2">{item.synopsisTa}</p>
          </div>

          {/* Cast & Crew */}
          {(item.director || item.cast) && (
            <div className="mt-5">
              <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2">Cast & Crew</h3>
              {item.director && (
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] text-vmuted w-20">Director</span>
                  <span className="text-sm font-semibold text-white">{item.director}</span>
                </div>
              )}
              {item.cast && item.cast.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-vmuted w-20">Featuring</span>
                  <span className="text-sm font-semibold text-white">{item.cast.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* More Like This */}
      <div className="mt-6 lg:pl-24 xl:pl-64">
        <SectionRow title="More Like This" titleTa="இது போன்ற மேலும்">
          {moreLikeThis.map((d) => (<ContentCard key={d.id} item={d} onClick={() => onCardClick(d)} />))}
        </SectionRow>
      </div>

      <div className="h-8" />
    </div>
  );
}
