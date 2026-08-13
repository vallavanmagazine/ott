import { Bell, Cast, Search, Settings, Tv } from 'lucide-react';
import { LogoFull } from './Logo';
import { useDevice } from '@/hooks/useDevice';

interface HeaderProps {
  onSearch?: () => void;
  onNotifications?: () => void;
  onSettings?: () => void;
  onLive?: () => void;
  showCast?: boolean;
  showSettings?: boolean;
  showSearchIcon?: boolean;
  showLiveIcon?: boolean;
  notificationCount?: number;
  title?: string;
  subtitle?: string;
}

export function Header({
  onSearch,
  onNotifications,
  onSettings,
  onLive,
  showCast = true,
  showSettings = false,
  showSearchIcon = true,
  showLiveIcon = true,
  notificationCount = 3,
  title,
  subtitle,
}: HeaderProps) {
  const device = useDevice();
  const logoSize = device.isMobile ? 34 : 40;

  return (
    <header className="sticky top-0 z-30 bg-vblack/85 backdrop-blur-xl border-b border-white/5 safe-top">
      <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-3">
        <div className="flex items-center justify-between">
          {title ? (
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-vmuted mt-0.5">{subtitle}</p>}
            </div>
          ) : (
            <LogoFull size={logoSize} />
          )}

          <div className="flex items-center gap-1.5">
            {showLiveIcon && (
              <button
                onClick={onLive}
                className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition"
                aria-label="Live TV"
              >
                <Tv size={18} className="text-white/80" />
              </button>
            )}
            {showCast && (
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition">
                <Cast size={18} className="text-white/80" />
              </button>
            )}
            <button
              onClick={onNotifications}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition relative"
            >
              <Bell size={18} className="text-white/80" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-vred rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
            {showSearchIcon && (
              <button
                onClick={onSearch}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition"
              >
                <Search size={18} className="text-white/80" />
              </button>
            )}
            {showSettings && (
              <button
                onClick={onSettings}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition"
              >
                <Settings size={18} className="text-white/80" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
