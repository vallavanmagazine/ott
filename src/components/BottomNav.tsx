import { Search, User } from 'lucide-react';
import { useDevice, type DeviceType } from '@/hooks/useDevice';

export type TabKey = 'search' | 'feed' | 'profile';

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

  // Mobile + Tablet: bottom bar with center logo button
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto">
      <div className="glass-strong border-t border-white/8 safe-bottom">
        <div className="flex items-stretch justify-around px-1 py-1.5 relative">
          {/* Left: Search */}
          <NavButton
            label="Search"
            Icon={Search}
            isActive={active === 'search'}
            onClick={() => onChange('search')}
          />

          {/* Center: Logo / Feed button */}
          <button
            onClick={() => onChange('feed')}
            className="flex flex-col items-center gap-0.5 pt-0.5 active:scale-90 transition no-select"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition ${
                active === 'feed'
                  ? 'border-vred bg-vred/15'
                  : 'border-white/15 bg-white/5'
              }`}
            >
              <img
                src="/icons/vallavanicon.webp"
                alt="Vallavan"
                className="w-7 h-7 rounded-full object-cover"
              />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                active === 'feed' ? 'text-vred' : 'text-vmuted'
              }`}
            >
              Feed
            </span>
          </button>

          {/* Right: Profile */}
          <NavButton
            label="Profile"
            Icon={User}
            isActive={active === 'profile'}
            onClick={() => onChange('profile')}
          />
        </div>
      </div>
    </nav>
  );
}

function NavButton({
  label,
  Icon,
  isActive,
  onClick,
}: {
  label: string;
  Icon: typeof Search;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
        {label}
      </span>
    </button>
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

  const railItems: { key: TabKey; label: string; icon: typeof Search }[] = [
    { key: 'search', label: 'Search', icon: Search },
    { key: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      className={`fixed left-0 top-0 bottom-0 z-40 w-20 xl:w-60 border-r border-white/8 bg-vblack/95 backdrop-blur-xl safe-top flex flex-col ${
        isTV ? 'text-lg' : ''
      }`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 no-select">
          <img src="/icons/vallavanicon.webp" width={32} height={32} alt="Vallavan" className="rounded-full object-cover" />
          <span className="hidden xl:block font-black text-white text-sm tracking-wide">VALLAVAN</span>
        </div>
      </div>

      {/* Search + Profile rail items */}
      <div className="flex-1 py-4 px-2 xl:px-3 space-y-1">
        {railItems.map((tab) => {
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

      {/* Center Feed logo button at bottom */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => onChange('feed')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition no-select ${
            active === 'feed'
              ? 'bg-vred/15 ring-2 ring-vred'
              : 'hover:bg-white/5'
          }`}
        >
          <img
            src="/icons/vallavanicon.webp"
            alt="Vallavan"
            className={`w-8 h-8 rounded-full object-cover ${active === 'feed' ? 'ring-2 ring-vred' : ''}`}
          />
          <span className={`hidden xl:block text-sm font-semibold ${active === 'feed' ? 'text-vred' : 'text-vmuted'}`}>
            Feed
          </span>
        </button>
      </div>
    </nav>
  );
}
