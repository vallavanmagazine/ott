import {
  Camera, ChevronRight, History, Bookmark,
  Star, Megaphone, BarChart3, CreditCard, LifeBuoy,
  Bot, MessageCircle, Settings, HelpCircle, Info, Heart, Briefcase, Users,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Divider } from '@/components/ui';
import { userProfile, pexelsUrl } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { getWatchHistory, getWatchLater } from '@/lib/library';

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
            {auth.isLoggedIn && (
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-vgold/20 border border-vgold/40">
                <Star size={10} className="text-vgold" fill="currentColor" />
                <span className="text-[9px] font-black tracking-wider text-vgold uppercase">Sponsor</span>
              </div>
            )}
          </div>
          <ChevronRight size={20} className="text-vmuted" />
        </div>
      </section>

      {/* AVOD message — replaces premium/subscription */}
      <section className="px-4 sm:px-6 lg:px-8 mt-3">
        <div className="flex items-center gap-3 p-3.5 rounded-card glass border border-vred/20">
          <Heart size={18} className="text-vred flex-shrink-0" fill="currentColor" />
          <p className="text-xs text-white/90 leading-relaxed">
            Vallavan is <span className="font-bold text-white">free for everyone</span> — supported by sponsors.
          </p>
        </div>
      </section>

      {/* Account section */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Account</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={History} label="Watch History" value={`${historyCount} ${historyCount === 1 ? 'title' : 'titles'}`} onClick={onWatchHistory} />
          <ProfileRow icon={Bookmark} label="Watch Later" value={`${laterCount} saved`} onClick={onWatchLater} />
        </div>
      </section>

      {/* Business Center */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <button onClick={() => onBusinessItem('sponsor')} className="flex items-center gap-2 mb-2.5 px-1 active:scale-95 transition">
          <Star size={14} className="text-vgold" fill="currentColor" />
          <h3 className="text-[10px] tracking-wider uppercase text-vgold font-bold">Business Center</h3>
          <ChevronRight size={12} className="text-vgold" />
        </button>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={Star} label="Become a Sponsor" onClick={() => onBusinessItem('sponsor-promo')} accent />
          <ProfileRow icon={CreditCard} label="Sponsor Signup (KYC)" sub="Verify your business with a phone OTP" onClick={() => onBusinessItem('sponsor-kyc')} accent />
          <ProfileRow icon={Megaphone} label="Create Campaign" onClick={() => onBusinessItem('create-campaign')} accent />
          <ProfileRow icon={BarChart3} label="My Campaigns" value="4 campaigns" onClick={() => onBusinessItem('my-campaigns')} accent />
          <ProfileRow icon={BarChart3} label="Campaign Reports" value="Analytics" onClick={() => onBusinessItem('campaign-analytics')} accent />
          <ProfileRow icon={CreditCard} label="Billing & Payments" onClick={() => onBusinessItem('billing')} accent />
          <ProfileRow icon={LifeBuoy} label="Support" onClick={() => onBusinessItem('support')} accent />
          <ProfileRow icon={Bot} label="AI Studio" sub="Generate ads, banners & captions with AI" onClick={() => onBusinessItem('ai-studio')} accent />
          <ProfileRow icon={MessageCircle} label="AI Assistant" sub="Tamil voice & text campaign help" onClick={() => onBusinessItem('ai-assistant')} accent />
        </div>
      </section>

      {/* Freelancer Center */}
      <section className="px-4 sm:px-6 lg:px-8 mt-5">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <Briefcase size={14} className="text-vgold" />
          <h3 className="text-[10px] tracking-wider uppercase text-vgold font-bold">Freelancer Center</h3>
        </div>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={Users} label="Join as Freelancer" sub="Reporter, Anchor, Writer, Editor, Producer" onClick={() => onBusinessItem('freelancer-career')} accent />
          <ProfileRow icon={Briefcase} label="Freelancer Dashboard" onClick={() => onBusinessItem('freelancer-dashboard')} accent />
          <ProfileRow icon={BarChart3} label="My Earnings" onClick={() => onBusinessItem('freelancer-earnings')} accent />
          <ProfileRow icon={Bookmark} label="Magazine Reseller" onClick={() => onBusinessItem('magazine-reseller')} accent />
        </div>
      </section>

      {/* Grow Your Brand promo */}
      <section className="px-4 sm:px-6 lg:px-8 mt-4">
        <div className="relative rounded-card overflow-hidden border border-vgold/30">
          <div className="absolute inset-0 bg-gradient-to-r from-vgold/10 via-vblack to-vblack" />
          <div className="relative p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-vgold/20 flex items-center justify-center flex-shrink-0">
              <Megaphone size={22} className="text-vgold" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-white">Grow Your Brand</h3>
              <p className="text-[11px] text-vmuted mt-0.5">Reach millions of Tamil viewers.</p>
            </div>
            <button
              onClick={() => onBusinessItem('sponsor')}
              className="px-3.5 py-2 rounded-full bg-vgold text-black text-xs font-black active:scale-95 transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      <Divider />

      {/* Settings */}
      <section className="px-4 sm:px-6 lg:px-8">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 px-1">Settings</h3>
        <div className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <ProfileRow icon={Settings} label="App Settings" onClick={onAppSettings} />
          <ProfileRow icon={HelpCircle} label="Help & Support" onClick={onHelp} />
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
