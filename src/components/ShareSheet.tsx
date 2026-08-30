import { useState } from 'react';
import { MessageCircle, Mail, Copy, Check, X } from 'lucide-react';
import { contentShareLinks } from '@/services/share';

/**
 * Fallback share menu, shown only when the OS share sheet is unavailable —
 * i.e. desktop browsers without the Web Share API. On mobile the native sheet
 * handles this and the component never mounts.
 *
 * The WhatsApp/SMS/Email row is deliberately the same markup and classes as
 * the payment-link share row in WalletTopUpScreen, so the two share surfaces
 * look like one feature rather than two.
 */
export function ShareSheet({
  title,
  url,
  onClose,
  onShared,
}: {
  title: string;
  url: string;
  onClose: () => void;
  /** Fired once the share actually leaves the app — a copied link or a picked
   *  channel. Opening the sheet is not a share, so it does not fire here. */
  onShared?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const links = contentShareLinks(url, title);

  const copy = () => {
    navigator.clipboard?.writeText(url).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 1500); onShared?.(); },
      () => { /* clipboard blocked — the URL is visible in the field regardless */ },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Stop clicks inside the card from closing it via the backdrop handler. */}
      <div
        className="w-full sm:max-w-sm m-0 sm:m-4 p-4 rounded-t-card sm:rounded-card glass-strong safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Share</div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-full glass">
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className="text-sm font-bold text-white mb-2 line-clamp-2">{title}</div>

        <div className="flex items-center gap-2">
          <input readOnly value={url} className="flex-1 px-3 py-2.5 rounded-lg glass text-xs text-white outline-none" />
          <button onClick={copy} aria-label="Copy link" className="w-10 h-10 flex items-center justify-center rounded-lg bg-vred text-white">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <div className="flex gap-2 mt-2" onClick={() => onShared?.()}>
          <a href={links.whatsapp} target="_blank" rel="noreferrer" className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold flex items-center justify-center gap-1.5"><MessageCircle size={14} /> WhatsApp</a>
          <a href={links.sms} className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold flex items-center justify-center gap-1.5"><MessageCircle size={14} /> SMS</a>
          <a href={links.email} className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold flex items-center justify-center gap-1.5"><Mail size={14} /> Email</a>
        </div>
      </div>
    </div>
  );
}
