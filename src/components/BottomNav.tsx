import { Home, Compass, Newspaper, Sparkles, User } from 'lucide-react';
import { useDevice, type DeviceType } from '@/hooks/useDevice';

export type TabKey = 'home' | 'feed' | 'explore' | 'inspire' | 'profile';

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'feed', label: 'Feed', icon: Newspaper },
  { key: 'explore', label: 'Explore', icon: Compass },
  { key: 'inspire', label: 'Inspire', icon: Sparkles },
  { key: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  const device = useDevice();

  if (device.isDesktop || device.isTV) {
    return <SideRail active={active} onChange={onChange} device={device.type} />;
  }

  // Mobile + Tablet: bottom bar
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto">
      <div className="glass-strong border-t border-white/8 safe-bottom">
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className="flex-1 flex flex-col items-center gap-1 py-1.5 active:scale-90 transition no-select"
              >
                <Icon
                  size={22}
                  className={isActive ? 'text-vred' : 'text-vmuted'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-semibold ${
                    isActive ? 'text-vred' : 'text-vmuted'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function SideRail({
  active,
  onChange,
  device,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  device: DeviceType;
}) {
  const isTV = device === 'tv';

  return (
    <nav
      className={`fixed left-0 top-0 bottom-0 z-40 w-20 xl:w-60 border-r border-white/8 bg-vblack/95 backdrop-blur-xl safe-top flex flex-col ${
        isTV ? 'text-lg' : ''
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 no-select">
          <img src="/icons/logo-mark.svg" width={32} height={32} alt="Vallavan" />
          <span className="hidden xl:block font-black text-white text-sm tracking-wide">VALLAVAN</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-4 px-2 xl:px-3 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition no-select ${
                isActive
                  ? 'bg-vred/15 text-vred'
                  : 'text-vmuted hover:bg-white/5 hover:text-white'
              } ${isTV ? 'focus:outline-none focus:ring-2 focus:ring-vred' : ''}`}
            >
              <Icon
                size={isTV ? 26 : 22}
                className={isActive ? 'text-vred' : ''}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`hidden xl:block text-sm font-semibold ${
                  isActive ? 'text-vred' : 'text-vmuted'
                }`}
              >
                {tab.label}
              </span>
              {isActive && <div className="hidden xl:block ml-auto w-1 h-6 bg-vred rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* AVOD note */}
      <div className="p-3 border-t border-white/5 hidden xl:block">
        <p className="text-[9px] text-vmuted leading-relaxed">
          Free for everyone.<br />Supported by sponsors.
        </p>
      </div>
    </nav>
  );
}
