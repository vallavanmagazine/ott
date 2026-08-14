import { Smartphone, Apple } from 'lucide-react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.vallavan.vallavan_app';
export const APP_STORE_URL = 'https://apps.apple.com/app/vallavan';

/** Compact "Get the app" banner for the profile page / footer. */
export function GetAppBanner() {
  return (
    <div className="relative rounded-card overflow-hidden border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-r from-vred/15 via-vblack to-vblack" />
      <div className="relative p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-vred/20 flex items-center justify-center flex-shrink-0"><Smartphone size={22} className="text-vred" /></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-white">Get the Vallavan app</div>
          <div className="text-[11px] text-vmuted">Sponsor & Freelancer dashboards live in the app.</div>
        </div>
      </div>
      <div className="relative px-4 pb-4 flex gap-2">
        <StoreButton store="play" />
        <StoreButton store="apple" />
      </div>
    </div>
  );
}

/** Post-signup card telling the user to download the app for their dashboard. */
export function DownloadAppCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="p-5 rounded-card glass-strong text-center">
      <div className="w-14 h-14 rounded-2xl bg-vred/20 flex items-center justify-center mx-auto mb-3"><Smartphone size={26} className="text-vred" /></div>
      <h3 className="text-base font-black text-white">{title}</h3>
      <p className="text-xs text-vmuted mt-1 max-w-xs mx-auto">{subtitle}</p>
      <div className="flex gap-2 mt-4 justify-center">
        <StoreButton store="play" />
        <StoreButton store="apple" />
      </div>
    </div>
  );
}

function StoreButton({ store }: { store: 'play' | 'apple' }) {
  const href = store === 'play' ? PLAY_STORE_URL : APP_STORE_URL;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-black text-xs font-bold active:scale-95 transition">
      {store === 'play' ? <Smartphone size={15} /> : <Apple size={15} />}
      {store === 'play' ? 'Google Play' : 'App Store'}
    </a>
  );
}
