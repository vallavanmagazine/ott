import { Play, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { useDevice } from '@/hooks/useDevice';

export interface HeroData {
  id: string;
  title: string;
  titleTa?: string;
  genre?: string;
  genreColor?: string;
  duration?: string;
  synopsis?: string;
  badge?: string;
  exclusive?: boolean;
  quote?: string;
  backdrop: string;
}

/**
 * Full-bleed cinematic hero banner. No rounded card border, no container edge.
 * Black gradient scrim from transparent (top) to solid (bottom-left).
 * Text block max-width ~560px, left-anchored at bottom.
 * Compact fixed-width buttons (never full-row).
 */
export function HeroBanner({
  hero,
  onWatch,
  dots,
  dotIdx,
  onDotClick,
}: {
  hero: HeroData;
  onWatch: () => void;
  dots?: number;
  dotIdx?: number;
  onDotClick?: (i: number) => void;
}) {
  const [added, setAdded] = useState(false);
  const device = useDevice();

  return (
    <section className="relative w-full">
      {/* Full-bleed image — no rounded border, no container edge */}
      <div className={`relative w-full ${device.isMobile ? 'aspect-[16/12]' : 'aspect-[21/9] lg:aspect-[16/7]'}`}>
        <img
          src={hero.backdrop}
          alt={hero.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient scrim: transparent top → solid bottom-left */}
        <div className="absolute inset-0 bg-gradient-to-t from-vblack via-vblack/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-vblack/80 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 sm:left-6 lg:left-8 flex gap-2 safe-top">
          {hero.badge && (
            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
              hero.badge === 'FEATURED' ? 'bg-vgold text-black' : hero.badge === 'NEW' ? 'bg-vred text-white' : 'bg-white text-black'
            }`}>
              {hero.badge}
            </span>
          )}
          {hero.exclusive && (
            <span className="px-2 py-0.5 bg-vgold rounded text-[9px] font-black tracking-wider uppercase text-black">Exclusive</span>
          )}
          {hero.duration && (
            <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-semibold text-white">{hero.duration}</span>
          )}
        </div>

        {/* Text block: left-anchored, max-width ~560px */}
        <div className="absolute bottom-0 left-0 p-4 sm:p-6 lg:p-8 safe-bottom">
          <div className="max-w-[560px]">
            {hero.genre && hero.genreColor && (
              <span
                className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white mb-2"
                style={{ backgroundColor: hero.genreColor }}
              >
                {hero.genre}
              </span>
            )}
            <h2 className={`${device.isMobile ? 'text-xl' : 'text-2xl lg:text-3xl'} font-black text-white leading-tight`}>
              {hero.title}
            </h2>
            {hero.titleTa && (
              <p className={`font-tamil text-vmuted leading-tight mt-0.5 ${device.isMobile ? 'text-sm' : 'text-base'}`}>{hero.titleTa}</p>
            )}
            {hero.quote && (
              <p className="text-sm text-vgold italic mt-2 line-clamp-2">"{hero.quote}"</p>
            )}
            {hero.synopsis && (
              <p className={`text-vmuted mt-2 line-clamp-2 ${device.isMobile ? 'text-[11px]' : 'text-sm'}`}>{hero.synopsis}</p>
            )}

            {/* Compact fixed-width buttons — never full-row */}
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={onWatch}
                className="w-[180px] sm:w-[200px] py-2.5 rounded-full bg-vred text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition shadow-glow"
              >
                <Play size={16} fill="currentColor" /> Watch Now
              </button>
              <button
                onClick={() => setAdded((v) => !v)}
                className="w-11 h-11 rounded-full glass flex items-center justify-center active:scale-90 transition flex-shrink-0"
              >
                {added ? <Check size={18} className="text-vgold" /> : <Plus size={18} className="text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      {dots != null && dots > 1 && (
        <div className="flex items-center gap-1.5 justify-center mt-3">
          {Array.from({ length: dots }).map((_, i) => (
            <button
              key={i}
              onClick={() => onDotClick?.(i)}
              className={`h-1.5 rounded-full transition-all ${i === dotIdx ? 'w-6 bg-vred' : 'w-1.5 bg-white/25'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
