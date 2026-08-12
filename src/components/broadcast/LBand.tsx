/** Sponsor L-band strip (side or bottom). */
export function LBand({ sponsorName, position = 'right' }: { sponsorName: string; position?: string }) {
  if (position === 'bottom') {
    return (
      <div className="absolute bottom-9 left-0 right-0 z-10 bg-gradient-to-r from-vgold/90 to-vgold/70 px-4 py-1.5 flex items-center justify-center gap-2 pointer-events-none">
        <span className="text-black text-[10px] font-black uppercase tracking-wider">Sponsored by</span>
        <span className="text-black text-sm font-black">{sponsorName}</span>
      </div>
    );
  }
  return (
    <div className="absolute top-0 bottom-9 right-0 w-16 z-10 bg-gradient-to-b from-vgold/90 to-vgold/60 flex flex-col items-center justify-center gap-2 pointer-events-none">
      <div className="text-black text-[9px] font-black uppercase tracking-wider" style={{ writingMode: 'vertical-rl' }}>
        Sponsored · {sponsorName}
      </div>
    </div>
  );
}
