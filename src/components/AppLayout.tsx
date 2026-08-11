import type { ReactNode } from 'react';
import { useDevice } from '@/hooks/useDevice';

/**
 * Shared responsive layout wrapper. Every screen uses this.
 * - Mobile (<640): max-width 430px frame, bottom nav padding
 * - Tablet (640-1024): max-width 768px centered, bottom nav padding
 * - Desktop (>1024): full-width, left padding offset for side rail (lg:pl-20 xl:pl-60)
 * - TV: full-width, left padding, larger text
 */
export function AppLayout({
  children,
  fullscreen = false,
}: {
  children: ReactNode;
  fullscreen?: boolean;
}) {
  const device = useDevice();

  if (fullscreen) {
    // Video player: always full-bleed, no nav offset
    return <div className="min-h-screen bg-vblack text-white">{children}</div>;
  }

  // Desktop/TV: offset for side rail, full width content
  if (device.isDesktop || device.isTV) {
    return (
      <div className={`min-h-screen bg-vblack text-white ${device.isTV ? 'text-lg' : ''}`}>
        <div className="lg:pl-20 xl:pl-60">{children}</div>
      </div>
    );
  }

  // Mobile/Tablet: centered frame
  const maxWidth = device.isTablet ? 'max-w-[768px]' : 'max-w-[430px]';
  return (
    <div className="min-h-screen bg-vblack text-white">
      <div className={`${maxWidth} mx-auto`}>{children}</div>
    </div>
  );
}

/**
 * For overlay/sub screens (detail, search, notifications, business) that need
 * a full-height container with optional bottom padding. Uses AppLayout internally.
 */
export function SubScreenLayout({
  children,
  padBottom = true,
}: {
  children: ReactNode;
  padBottom?: boolean;
}) {
  return (
    <AppLayout>
      <div className={padBottom ? 'pb-8' : ''}>{children}</div>
    </AppLayout>
  );
}
