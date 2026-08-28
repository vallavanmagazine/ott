/**
 * Admin toast notifications. Replaces blocking window.alert() across the CMS.
 * Mounted once by AdminApp; every admin screen calls useToast().
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** Runs `fn`, toasts `okMessage` on success and the error message on throw. */
  run: <T>(fn: () => Promise<T>, okMessage: string) => Promise<T | undefined>;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++;
    setToasts((list) => [...list, { id, kind, message }]);
    window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
  }, [dismiss]);

  const api = useMemo<ToastApi>(() => ({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
    run: async (fn, okMessage) => {
      try {
        const result = await fn();
        push('success', okMessage);
        return result;
      } catch (e) {
        push('error', (e as Error).message || 'Something went wrong');
        return undefined;
      }
    },
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-2.5 min-w-[260px] max-w-[380px] px-3.5 py-3 rounded-xl border shadow-2xl animate-slide-up backdrop-blur-xl ${
              t.kind === 'success' ? 'bg-green-500/15 border-green-500/40'
                : t.kind === 'error' ? 'bg-red-500/15 border-red-500/40'
                : 'bg-white/10 border-white/20'
            }`}
          >
            {t.kind === 'success' && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0 mt-0.5" />}
            {t.kind === 'error' && <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
            {t.kind === 'info' && <Info size={16} className="text-white/70 flex-shrink-0 mt-0.5" />}
            <span className="flex-1 text-xs text-white leading-relaxed">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/50 hover:text-white flex-shrink-0">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Toast API. Falls back to console-only no-ops outside a provider (tests). */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  return {
    success: (m) => console.log('[toast]', m),
    error: (m) => console.error('[toast]', m),
    info: (m) => console.log('[toast]', m),
    run: async (fn) => { try { return await fn(); } catch (e) { console.error(e); return undefined; } },
  };
}
