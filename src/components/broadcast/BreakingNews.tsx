/** Full breaking-news overlay — video shrinks conceptually; red pulsing badge. */
export function BreakingNews({ headline, body }: { headline: string; body: string }) {
  if (!headline) return null;
  return (
    <div className="absolute bottom-16 left-0 right-0 z-30 pointer-events-none">
      <div className="mx-3">
        <div className="flex items-stretch rounded-lg overflow-hidden shadow-2xl">
          <div className="bg-vred px-3 py-2.5 flex items-center breaking-pulse">
            <span className="text-white text-[11px] font-black tracking-widest">BREAKING</span>
          </div>
          <div className="flex-1 bg-black/90 backdrop-blur-sm px-4 py-2">
            <div className="text-white font-black text-sm leading-tight">{headline}</div>
            {body && <div className="text-white/80 text-[11px] leading-snug mt-0.5">{body}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
