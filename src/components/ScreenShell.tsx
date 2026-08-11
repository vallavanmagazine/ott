import type { ReactNode } from 'react';
import { AppLayout } from './AppLayout';
import { useDevice } from '@/hooks/useDevice';

export function ScreenShell({
  children,
  noPad = false,
}: {
  children: ReactNode;
  noPad?: boolean;
}) {
  return (
    <AppLayout>
      <div className={noPad ? '' : 'pb-20'}>{children}</div>
    </AppLayout>
  );
}

export function SubPageHeader({
  title,
  onBack,
  rightAction,
}: {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
}) {
  const device = useDevice();
  return (
    <header className="sticky top-0 z-30 bg-vblack/85 backdrop-blur-xl border-b border-white/5 safe-top">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90 transition flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className={`font-black text-white flex-1 truncate ${device.isTV ? 'text-xl' : 'text-base lg:text-lg'}`}>{title}</h1>
        {rightAction}
      </div>
    </header>
  );
}
