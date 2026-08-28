/** Logo watermark (channel bug) — configurable position + opacity. */
const POS: Record<string, string> = {
  'top-left': 'top-3 left-3',
  'top-right': 'top-3 right-3',
  'bottom-left': 'bottom-16 left-3',
  'bottom-right': 'bottom-16 right-3',
};

export function ChannelBug({
  position = 'bottom-right',
  opacity = 70,
  compact = false,
  className = '',
}: { position?: string; opacity?: number; compact?: boolean; className?: string }) {
  return (
    <div
      className={`absolute ${POS[position] ?? POS['bottom-right']} z-20 pointer-events-none flex items-center gap-1.5 ${className}`}
      style={{ opacity: opacity / 100 }}
    >
      <img src="/icons/logo-mark.svg" width={compact ? 20 : 26} height={compact ? 20 : 26} alt="" />
      {!compact && <span className="text-white font-black text-xs tracking-wider drop-shadow-lg">VALLAVAN TV</span>}
    </div>
  );
}
