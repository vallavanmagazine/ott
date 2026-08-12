import { Plus, Play, Check, Star } from 'lucide-react';
import { useState } from 'react';
import { type Documentary, genreColors, pexelsUrl } from '@/data/mockData';
import { useDevice } from '@/hooks/useDevice';
import { isWatchLater, toggleWatchLater } from '@/lib/library';

interface ContentCardProps {
  item: Documentary;
  onClick?: () => void;
  variant?: 'portrait' | 'landscape';
  showProgress?: boolean;
}

export function ContentCard({ item, onClick, variant = 'landscape', showProgress }: ContentCardProps) {
  const [added, setAdded] = useState(() => isWatchLater(item.id));
  const device = useDevice();
  const genreColor = genreColors[item.genre] || '#666';

  const aspect = variant === 'portrait' ? 'aspect-[2/3]' : 'aspect-video';
  const cardWidth = variant === 'portrait' ? 'w-[130px]' : device.isMobile ? 'w-[230px]' : 'w-full';

  return (
    <div
      className={`group relative ${cardWidth} flex-shrink-0 text-left no-select cursor-pointer ${
        device.isTV ? 'focus:outline-none focus:ring-2 focus:ring-vred rounded-card' : ''
      }`}
      onClick={onClick}
      tabIndex={device.isTV ? 0 : undefined}
    >
      <div className={`relative ${aspect} rounded-card overflow-hidden bg-white/5 card-shadow border border-white/8 transition-all duration-300 ${
        device.isDesktop && device.hasHover ? 'group-hover:scale-105 group-hover:shadow-glow group-hover:border-white/20' : ''
      }`}>
        <img
          src={pexelsUrl(item.poster, 400)}
          alt={item.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-active:scale-95 transition duration-300"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        {/* badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.badge && (
            <span
              className={`px-1.5 py-0.5 text-[8px] font-black tracking-wider rounded uppercase ${
                item.badge === 'FEATURED'
                  ? 'bg-vgold text-black'
                  : item.badge === 'NEW'
                  ? 'bg-vred text-white'
                  : 'bg-white text-black'
              }`}
            >
              {item.badge}
            </span>
          )}
          {item.exclusive && (
            <span className="px-1.5 py-0.5 text-[8px] font-black tracking-wider rounded uppercase bg-vgold/90 text-black flex items-center gap-0.5">
              <Star size={7} fill="currentColor" /> Exclusive
            </span>
          )}
        </div>

        {/* duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-semibold text-white backdrop-blur-sm">
          {item.duration}
        </div>

        {/* add button */}
        <div
          className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center active:scale-90 transition"
          onClick={(e) => {
            e.stopPropagation();
            setAdded(toggleWatchLater(item));
          }}
        >
          {added ? (
            <Check size={14} className="text-vgold" />
          ) : (
            <Plus size={14} className="text-white" />
          )}
        </div>

        {/* progress bar */}
        {showProgress && item.progress != null && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-vred"
              style={{ width: `${item.progress * 100}%` }}
            />
          </div>
        )}

        {/* Desktop hover preview overlay */}
        {device.isDesktop && device.hasHover && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <div className="flex items-center gap-2 mb-2">
              <button className="w-8 h-8 rounded-full bg-vred flex items-center justify-center active:scale-90 transition">
                <Play size={14} fill="white" className="text-white ml-0.5" />
              </button>
              <button className="w-8 h-8 rounded-full glass flex items-center justify-center active:scale-90 transition">
                {added ? <Check size={14} className="text-vgold" /> : <Plus size={14} className="text-white" />}
              </button>
              <span className="ml-auto text-[10px] text-vmuted">{item.duration}</span>
            </div>
          </div>
        )}
      </div>

      {/* meta */}
      <div className="mt-2 px-0.5">
        <div className="text-[13px] font-bold text-white leading-tight line-clamp-1">{item.title}</div>
        <div className="text-[11px] text-vmuted font-tamil leading-tight line-clamp-1">{item.titleTa}</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide text-white"
            style={{ backgroundColor: genreColor }}
          >
            {item.genre}
          </span>
          <span className="text-[9px] text-vmuted">{item.year}</span>
        </div>
      </div>
    </div>
  );
}

export function PortraitCard({ item, onClick }: { item: Documentary; onClick?: () => void }) {
  return <ContentCard item={item} onClick={onClick} variant="portrait" />;
}

export function ContinueWatchingCard({ item, onClick }: { item: Documentary; onClick?: () => void }) {
  return <ContentCard item={item} onClick={onClick} variant="landscape" showProgress />;
}
