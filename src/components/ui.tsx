import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRef, useState, useEffect } from 'react';
import { useDevice } from '@/hooks/useDevice';

export function SectionRow({
  title,
  titleTa,
  actionLabel = 'See all',
  onAction,
  children,
}: {
  title: string;
  titleTa?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  const device = useDevice();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const showArrows = (device.isDesktop || device.isTV) && device.hasHover;

  // On desktop without touch, use grid instead of horizontal scroll
  const useGrid = (device.isDesktop || device.isTV) && !device.hasTouch;

  if (useGrid) {
    const childArr = Array.isArray(children) ? children : [children];
    return (
      <section className="mt-6 animate-fade-in px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-base lg:text-lg font-black text-white leading-tight">{title}</h2>
            {titleTa && <p className="text-[11px] text-vmuted font-tamil leading-tight">{titleTa}</p>}
          </div>
          {onAction && (
            <button
              onClick={onAction}
              className="flex items-center gap-0.5 text-[11px] lg:text-xs font-semibold text-vred hover:text-vred-light active:scale-95 transition"
            >
              {actionLabel} <ChevronRight size={14} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {childArr.map((c, i) => (
            <div key={i} className="w-full">{c}</div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 animate-fade-in relative group">
      <div className="flex items-end justify-between px-4 sm:px-6 mb-3">
        <div>
          <h2 className="text-base lg:text-lg font-black text-white leading-tight">{title}</h2>
          {titleTa && <p className="text-[11px] text-vmuted font-tamil leading-tight">{titleTa}</p>}
        </div>
        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-0.5 text-[11px] lg:text-xs font-semibold text-vred active:scale-95 transition"
          >
            {actionLabel} <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="relative">
        {/* Left arrow */}
        {showArrows && canLeft && (
          <button
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-vblack/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}
        {/* Right arrow */}
        {showArrows && canRight && (
          <button
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-vblack/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        <div ref={scrollRef} className="hscroll flex gap-3 px-4 sm:px-6 pb-1">
          {children}
        </div>
      </div>
    </section>
  );
}

export function LiveBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]';
  return (
    <span className={`inline-flex items-center gap-1 ${pad} bg-vred rounded font-black tracking-wider text-white uppercase`}>
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-live" />
      Live
    </span>
  );
}

export function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
        active
          ? 'bg-vred text-white'
          : 'glass text-vmuted'
      }`}
      style={active && color ? { backgroundColor: color } : undefined}
    >
      {label}
    </button>
  );
}

export function Divider({ label }: { label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 my-5">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[10px] font-bold tracking-wider uppercase text-vmuted">{label}</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );
  }
  return <div className="h-px bg-white/8 mx-4 sm:mx-6 lg:mx-8 my-5" />;
}
