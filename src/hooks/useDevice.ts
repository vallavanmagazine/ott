import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTV: boolean;
  width: number;
  hasHover: boolean;
  hasTouch: boolean;
}

function detect(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { type: 'desktop', isMobile: false, isTablet: false, isDesktop: true, isTV: false, width: 1024, hasHover: true, hasTouch: false };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const ua = navigator.userAgent.toLowerCase();

  // Android TV / smart TV detection
  const isTVUA = ua.includes('tv') || ua.includes('aftt') || ua.includes('crkey') || ua.includes('android tv') || ua.includes('smarttv');
  const isTV = isTVUA || (width >= 1920 && height >= 1080);

  let type: DeviceType = 'mobile';
  if (isTV) type = 'tv';
  else if (width >= 1024) type = 'desktop';
  else if (width >= 640) type = 'tablet';
  else type = 'mobile';

  // Hover & touch capability
  const hasHover = window.matchMedia('(hover: hover)').matches && !('ontouchstart' in window);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Override: if touch device but wide (e.g. tablet landscape), keep tablet not desktop
  if (hasTouch && type === 'desktop' && width < 1440) type = 'tablet';

  return {
    type,
    isMobile: type === 'mobile',
    isTablet: type === 'tablet',
    isDesktop: type === 'desktop',
    isTV: type === 'tv',
    width,
    hasHover,
    hasTouch,
  };
}

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(detect);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setDevice(detect()));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return device;
}
