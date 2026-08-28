/**
 * Shared admin CMS primitives — modal with an always-visible sticky Save bar,
 * form fields, toggles, loading skeletons, confirm dialog, tabs.
 * Admin-only: none of these are used by the viewer app.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { X, Search, Loader2, AlertTriangle } from 'lucide-react';
import { toEmbedUrl, videoKindLabel, willConvert } from '@/lib/video';

// ---------------------------------------------------------------------------
// Modal — header + scrollable body + STICKY footer so Save is always reachable
// ---------------------------------------------------------------------------
export function AdminModal({
  title, subtitle, onClose, children, footer, wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className={`w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} bg-vblack rounded-2xl border border-white/10 shadow-2xl animate-slide-up my-4 flex flex-col max-h-[92vh]`}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/8 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-base font-black text-white truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-vmuted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full glass flex-shrink-0">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">{children}</div>

        {footer && (
          <div className="flex-shrink-0 px-5 py-3.5 border-t border-white/8 bg-vblack/95 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Standard modal footer: Cancel + a full-width red primary action. */
export function SaveBar({
  onCancel, onSave, saving, label = 'Save', disabled,
}: { onCancel: () => void; onSave: () => void; saving?: boolean; label?: string; disabled?: boolean }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onCancel}
        className="px-5 py-3 rounded-full glass text-white font-bold text-sm active:scale-95 transition"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="flex-1 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 size={15} className="animate-spin" />}
        {saving ? 'Saving...' : label}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------
export function ConfirmDialog({
  title, message, confirmLabel = 'Delete', onConfirm, onCancel, busy,
}: {
  title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={17} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-white">{title}</h3>
            <p className="text-xs text-vmuted mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold active:scale-95">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 py-2.5 rounded-full bg-vred text-white text-xs font-bold active:scale-95 disabled:opacity-50"
          >
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred transition';

export function Field({
  label, required, hint, children, counter,
}: { label: string; required?: boolean; hint?: string; children: ReactNode; counter?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">
          {label}{required && <span className="text-vred ml-0.5">*</span>}
        </label>
        {counter && <span className="text-[9px] text-vmuted tabular-nums">{counter}</span>}
      </div>
      <div className="mt-1">{children}</div>
      {hint && <p className="text-[10px] text-vmuted mt-1">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={`${inputClass} ${className ?? ''}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={`${inputClass} resize-none ${className ?? ''}`} />;
}

export function SelectInput({ children, className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={`${inputClass} ${className ?? ''}`}>
      {children}
    </select>
  );
}

/** Labelled switch row used across forms and control panels. */
export function ToggleRow({
  on, onChange, label, sub,
}: { on: boolean; onChange: (next: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="w-full flex items-center justify-between gap-3 p-3 rounded-xl glass text-left">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-[10px] text-vmuted mt-0.5">{sub}</div>}
      </div>
      <div className={`w-11 h-6 rounded-full p-0.5 flex-shrink-0 transition ${on ? 'bg-vred' : 'bg-white/15'}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition ${on ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  );
}

/** Compact inline switch (table cells). */
export function InlineToggle({ on, onClick, title }: { on: boolean; onClick: () => void; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title} className="inline-flex">
      <div className={`w-9 h-5 rounded-full p-0.5 transition ${on ? 'bg-vred' : 'bg-white/15'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition ${on ? 'translate-x-4' : ''}`} />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Chrome: search, tabs, pills, skeletons, empty state
// ---------------------------------------------------------------------------
export function SearchInput({
  value, onChange, placeholder = 'Search...',
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl glass min-w-[180px]">
      <Search size={16} className="text-vmuted flex-shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-vmuted outline-none min-w-0"
      />
    </div>
  );
}

export function Tabs<T extends string>({
  tabs, active, onChange,
}: { tabs: { key: T; label: string; count?: number }[]; active: T; onChange: (k: T) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3.5 py-2 rounded-full text-xs font-bold transition active:scale-95 flex items-center gap-1.5 ${
            active === t.key ? 'bg-vred text-white' : 'glass text-vmuted hover:text-white'
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`px-1.5 rounded-full text-[9px] ${active === t.key ? 'bg-black/25' : 'bg-white/10'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  green: 'text-green-400 bg-green-500/15',
  gold: 'text-vgold bg-vgold/15',
  red: 'text-red-400 bg-red-500/15',
  blue: 'text-blue-400 bg-blue-500/15',
  purple: 'text-purple-300 bg-purple-500/15',
  grey: 'text-white/60 bg-white/10',
};

export type PillTone = keyof typeof PILL_TONES;

/** Maps a status string to a tone. Unknown statuses render grey. */
export function toneForStatus(status: string): PillTone {
  const s = status.toLowerCase();
  if (['published', 'active', 'live', 'approved', 'paid', 'posted', 'completed'].includes(s)) return 'green';
  if (['draft', 'pending', 'pending approval', 'paused', 'open', 'created', 'assigned', 'submitted'].includes(s)) return 'gold';
  if (['suspended', 'rejected', 'ended', 'failed', 'expired'].includes(s)) return 'red';
  if (s === 'scheduled') return 'blue';
  return 'grey';
}

export function StatusPill({ status, tone }: { status: string; tone?: PillTone }) {
  const resolved = tone ?? toneForStatus(status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${PILL_TONES[resolved]}`}>
      {status}
    </span>
  );
}

export function StatCard({
  label, value, accent, icon,
}: { label: string; value: string | number; accent?: string; icon?: ReactNode }) {
  return (
    <div className="p-3.5 rounded-xl glass">
      <div className="flex items-center gap-1.5 text-[10px] text-vmuted uppercase tracking-wider font-bold mb-1">
        {icon}{label}
      </div>
      <div className={`text-xl font-black ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}

/** Shimmer placeholder rows shown while a table is loading. */
export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3 rounded bg-white/8 animate-pulse"
              style={{ width: c === 0 ? '28%' : `${Math.max(8, 60 / cols)}%`, animationDelay: `${(r * cols + c) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl glass">
          <div className="h-3 w-2/3 rounded bg-white/8 animate-pulse" />
          <div className="h-6 w-1/2 rounded bg-white/8 animate-pulse mt-3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="p-10 rounded-xl glass text-center">
      <p className="text-sm font-semibold text-white/80">{title}</p>
      {hint && <p className="text-xs text-vmuted mt-1.5">{hint}</p>}
    </div>
  );
}

/**
 * Shows what a pasted video URL was detected as, and — for YouTube watch /
 * shorts / youtu.be links — the embed URL it will actually be saved as.
 * Making the rewrite visible avoids the admin wondering why the stored value
 * differs from what they pasted.
 */
export function VideoUrlHint({ url }: { url: string }) {
  if (!url.trim()) return null;
  const converted = toEmbedUrl(url);
  const rewritten = willConvert(url);
  return (
    <div className="mt-1 space-y-0.5">
      <p className="text-[10px] text-vgold">Detected: {videoKindLabel(url)}</p>
      {rewritten && (
        <p className="text-[10px] text-vmuted break-all">
          Saved as <span className="font-mono text-white/70">{converted}</span>
        </p>
      )}
    </div>
  );
}

/** Small icon button used in table action columns. */
export function IconButton({
  onClick, title, children, danger, disabled,
}: { onClick: () => void; title: string; children: ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`w-7 h-7 flex items-center justify-center rounded-lg transition disabled:opacity-40 ${
        danger ? 'text-vmuted hover:bg-red-500/15 hover:text-red-400' : 'text-vmuted hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/** Row-level busy bookkeeping shared by every list screen. */
export function useBusy() {
  const [busy, setBusy] = useState<string | null>(null);
  const withBusy = async <T,>(id: string, fn: () => Promise<T>): Promise<T> => {
    setBusy(id);
    try { return await fn(); } finally { setBusy(null); }
  };
  return { busy, isBusy: (id: string) => busy === id, withBusy };
}
