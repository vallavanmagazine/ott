import { ArrowRight } from 'lucide-react';
import { type AdContent, pexelsUrl } from '@/data/mockData';

export function AdSlot({
  ad,
  variant = 'banner',
  onClick,
}: {
  ad: AdContent;
  variant?: 'banner' | 'native';
  onClick?: () => void;
}) {
  if (variant === 'native') {
    return (
      <button
        onClick={onClick}
        className="relative w-[230px] flex-shrink-0 text-left no-select"
      >
        <div className="relative aspect-video rounded-card overflow-hidden bg-white/5 card-shadow border border-white/8">
          <img
            src={pexelsUrl(ad.bgImage, 400)}
            alt={ad.sponsor}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-vgold/90 rounded text-[8px] font-black tracking-wider uppercase text-black">
            Sponsored
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <div className="text-[10px] text-vgold font-bold mb-0.5">{ad.sponsor}</div>
            <div className="text-[13px] font-bold text-white leading-tight line-clamp-2">{ad.headline}</div>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-[10px] font-semibold text-white">
              {ad.cta} <ArrowRight size={10} />
            </div>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-vmuted">Ad · {ad.sponsor}</div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left no-select group"
    >
      <div className="relative rounded-card overflow-hidden card-shadow border border-white/8 active:scale-[0.98] transition">
        <div className="aspect-[16/7] relative">
          <img
            src={pexelsUrl(ad.bgImage, 800)}
            alt={ad.sponsor}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/20" />
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: `linear-gradient(135deg, ${ad.accent}40, transparent)` }}
          />

          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-vgold/90 rounded text-[9px] font-black tracking-wider uppercase text-black">
                Sponsored
              </span>
              <span className="text-[10px] text-white/70 font-medium">{ad.sponsor}</span>
            </div>

            <div>
              <h3 className="text-base font-black text-white leading-tight">{ad.headline}</h3>
              <p className="text-xs text-white/70 mt-1 line-clamp-1">{ad.body}</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold active:scale-95 transition">
                {ad.cta} <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
