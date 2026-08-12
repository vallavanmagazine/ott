/** "Powered by [Sponsor]" strip. */
export function PoweredBy({ sponsorName }: { sponsorName: string }) {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 py-1.5 flex items-center justify-center gap-2 pointer-events-none">
      <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">Powered by</span>
      <span className="text-vgold text-xs font-black">{sponsorName}</span>
    </div>
  );
}
