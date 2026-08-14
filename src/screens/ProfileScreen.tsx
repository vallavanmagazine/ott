import {
  Camera, ChevronRight, History, Bookmark,
  Star, Users, Settings, Info, Heart, Bot, Briefcase,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Divider } from '@/components/ui';
import { userProfile, pexelsUrl } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { getWatchHistory, getWatchLater } from '@/lib/library';
import { GetAppBanner } from '@/components/GetApp';

/**
 * WEB profile (FIX 2/7). Web is viewer + signup only — NO dashboards. Sponsor
 * and freelancer flows show pricing/career + a form, then point users to the
 * mobile app. Support is the AI chatbot; no phone/WhatsApp anywhere.
 */
export function ProfileScreen({
  onNotifications,
  onBusinessItem,
  onLive,
  onWatchHistory,
  onWatchLater,
  onAppSettings,
  onHelp,
  onAbout,
}: {
  onNotifications: () => void;
  onBusinessItem: (item: string) => void;
  onLive: () => void;
  onWatchHistory: () => void;
  onWatchLater: () => void;
  onAppSettings: () => void;
  onHelp: () => void;
  onAbout: () => void;
}) {
  const auth = useAuth();
  const name = auth.isLoggedIn ? auth.name : userProfile.name;
  const email = auth.isLoggedIn ? auth.email : userProfile.email;
  const historyCount = getWatchHistory().length;
  const laterCount = getWatchLater().length;

  return (
    <div>
      <Header
        onNotifications={onNotifications}
        onSettings={onAppSettings}
        onLive={onLive}
        showSettings
        showCast={false}
        showSearchIcon={false}
        notificationCount={3}
      />

      {/* Profile card */}
      <section className="px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center gap-4 p-4 rounded-card glass-strong">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
              <img src={pexelsUrl(userProfile.avatar, 200)} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-vred flex items-center justify-center border-2 border-vblack">
              <Camera size={12} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white leading-tight">{name}</h2>
            <p className="text-xs text-vmuted leading-tight mt-0.5">{email}</p>
            {!auth.isLoggedIn && (
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/8">
                <span className="text-[9px] font-bold tracking-wider text-vmuted uppercase">Guest</span>
              </div>
            )}
          </div>
          <ChevronRight size={20} className="text-vmuted" />
        </div>
      </section>

      {/* AVOD message */}
      <section className="px-4 sm:px-6 lg:px-8 mt-3">
        <div className="flex items-center gap-3 p-3.5 rounded-card glass border border-vred/20">
          <Heart size={18} className="text-vred flex-shrink-0" fill="currentColor" />
          <p className="text-xs text-white/90 leading-relaxed">
            Vallavan is <span className="font-bold text-white">free for everyone</span> — supported by sponsors.
          </p>
        </div>
      </section>

      {/* Account */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Account</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={History} label="Watch History" value={`${historyCount} ${historyCount === 1 ? 'title' : 'titles'}`} onClick={onWatchHistory} />
          <ProfileRow icon={Bookmark} label="Watch Later" value={`${laterCount} saved`} onClick={onWatchLater} />
          <ProfileRow icon={Settings} label="App Settings" onClick={onAppSettings} />
        </div>
      </section>

      {/* Sponsor */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <h3 className="text-[10px] tracking-wider uppercase text-vgold font-bold mb-2.5 px-1">Sponsor</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={Star} label="Become a Sponsor" sub="See pricing & sign up your business" onClick={() => onBusinessItem('sponsor-promo')} accent />
        </div>
      </section>

      {/* Freelancer */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <h3 className="text-[10px] tracking-wider uppercase text-vgold font-bold mb-2.5 px-1">Freelancer</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={Briefcase} label="Join as Freelancer" sub="Reporter, Anchor, Writer, Editor, Producer" onClick={() => onBusinessItem('freelancer-career')} accent />
        </div>
      </section>

      {/* Get the app */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <GetAppBanner />
      </section>

      <Divider />

      {/* Support */}
      <section className="px-4 sm:px-6 lg:px-8">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Support</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={Bot} label="AI Assistant" sub="Chat with our assistant 24/7" onClick={onHelp} />
          <ProfileRow icon={Info} label="About Vallavan" value="v2.1.0" onClick={onAbout} />
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
  sub,
  onClick,
  accent,
}: {
  icon: typeof History;
  label: string;
  value?: string;
  sub?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 active:bg-white/5 hover:bg-white/5 transition text-left"
    >
      <Icon size={18} className={accent ? 'text-vgold' : 'text-vmuted'} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-[11px] text-vmuted">{sub}</div>}
      </div>
      {value && <span className="text-[11px] text-vmuted">{value}</span>}
      <ChevronRight size={16} className="text-vmuted" />
    </button>
  );
}
