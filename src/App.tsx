import { useState, useEffect } from 'react';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { ScreenShell } from '@/components/ScreenShell';
import { SplashScreen } from '@/screens/SplashScreen';
import { LiveScreen } from '@/screens/LiveScreen';
import { FeedScreen } from '@/screens/FeedScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DocumentaryDetailScreen } from '@/screens/DocumentaryDetailScreen';
import { VideoPlayerScreen } from '@/screens/VideoPlayerScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { HelpScreen } from '@/screens/HelpScreen';
import { AboutScreen } from '@/screens/AboutScreen';
import { WatchHistoryScreen } from '@/screens/WatchHistoryScreen';
import { WatchLaterScreen } from '@/screens/WatchLaterScreen';
import { SponsorPromoScreen } from '@/screens/business/SponsorPromoScreen';
import { SponsorSignupScreen } from '@/screens/business/SponsorSignupScreen';
import { RegisterScreen } from '@/screens/business/RegisterScreen';
import { FreelancerCareerScreen } from '@/screens/business/FreelancerCareerScreen';
import { DownloadAppScreen } from '@/screens/business/DownloadAppScreen';
import { AdminApp } from '@/screens/admin/AdminApp';
import { SponsorLoginModal } from '@/components/SponsorLoginModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { Documentary } from '@/data/mockData';

type Overlay =
  | { type: 'none' }
  | { type: 'detail'; item: Documentary }
  | { type: 'player'; item: Documentary }
  | { type: 'notifications' }
  | { type: 'business'; key: string }
  | { type: 'admin' }
  | { type: 'live' }
  | { type: 'settings' }
  | { type: 'help' }
  | { type: 'about' }
  | { type: 'watch-history' }
  | { type: 'watch-later' };

const SPONSOR_ITEMS = ['sponsor', 'create-campaign', 'my-campaigns', 'campaign-analytics', 'billing', 'wallet-topup', 'inspire-order'];

function AppInner() {
  const [showSplash, setShowSplash] = useState(true);
  // Three tabs only: Search | Feed (centre logo) | Profile.
  const [tab, setTab] = useState<TabKey>('feed');
  const [overlay, setOverlay] = useState<Overlay>({ type: 'none' });
  const [showSponsorLogin, setShowSponsorLogin] = useState(false);
  const [pendingBusinessItem, setPendingBusinessItem] = useState<string | null>(null);
  const auth = useAuth();

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setOverlay({ type: 'admin' });
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Trap the browser/hardware Back gesture: close the open overlay instead of
  // leaving the site. A history entry is pushed whenever an overlay opens.
  useEffect(() => {
    const onPop = () => setOverlay((o) => (o.type === 'none' ? o : { type: 'none' }));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (overlay.type !== 'none') window.history.pushState({ o: overlay.type }, '');
  }, [overlay.type]);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  // --- Admin route ---
  if (overlay.type === 'admin') {
    return <AdminApp onExit={() => { window.location.hash = ''; setOverlay({ type: 'none' }); }} />;
  }

  // --- Business sub-screen routing ---
  if (overlay.type === 'business') {
    const back = () => setOverlay({ type: 'none' });
    const navigate = (key: string) => setOverlay({ type: 'business', key });

    // WEB is viewer + signup only (FIX 2). Sponsor/freelancer DASHBOARDS live in
    // the mobile app — any dashboard/management key lands on DownloadAppScreen.
    switch (overlay.key) {
      case 'sponsor-promo':
        return <SponsorPromoScreen onBack={back} onStart={() => navigate('sponsor-register')} />;
      case 'sponsor-register':
        return <RegisterScreen role="sponsor" onBack={back} />;
      case 'freelancer-register':
        return <RegisterScreen role="freelancer" onBack={back} />;
      case 'sponsor-signup':
        return <SponsorSignupScreen onBack={back} />;
      case 'freelancer-career':
        return <FreelancerCareerScreen onBack={back} onApply={() => navigate('freelancer-register')} />;
      case 'ai-assistant':
        return <HelpScreen onBack={back} />;
      default:
        return <DownloadAppScreen onBack={back} />;
    }
  }

  // --- Documentary detail ---
  if (overlay.type === 'detail') {
    return (
      <DocumentaryDetailScreen
        item={overlay.item}
        onBack={() => setOverlay({ type: 'none' })}
        onPlay={(item) => setOverlay({ type: 'player', item })}
        onCardClick={(item) => setOverlay({ type: 'detail', item })}
      />
    );
  }

  // --- Main app with tabs ---
  const openCard = (item: Documentary) => setOverlay({ type: 'detail', item });
  const openNotifications = () => setOverlay({ type: 'notifications' });
  const openLive = () => setOverlay({ type: 'live' });

  const openBusiness = (key: string) => {
    // Sponsor-only items require login
    if (SPONSOR_ITEMS.includes(key) && !auth.isLoggedIn) {
      setPendingBusinessItem(key);
      setShowSponsorLogin(true);
      return;
    }
    setOverlay({ type: 'business', key });
  };

  const onSponsorLoginClose = () => {
    setShowSponsorLogin(false);
    // After successful login, proceed to pending item
    if (pendingBusinessItem && auth.isLoggedIn) {
      setOverlay({ type: 'business', key: pendingBusinessItem });
      setPendingBusinessItem(null);
    } else {
      setPendingBusinessItem(null);
    }
  };

  // --- Notifications overlay ---
  if (overlay.type === 'notifications') {
    return <NotificationsScreen onBack={() => setOverlay({ type: 'none' })} />;
  }

  // --- Profile sub-screens ---
  if (overlay.type === 'settings') return <SettingsScreen onBack={() => setOverlay({ type: 'none' })} />;
  if (overlay.type === 'help') return <HelpScreen onBack={() => setOverlay({ type: 'none' })} />;
  if (overlay.type === 'about') return <AboutScreen onBack={() => setOverlay({ type: 'none' })} />;
  if (overlay.type === 'watch-history') {
    return <WatchHistoryScreen onBack={() => setOverlay({ type: 'none' })} onCardClick={(item) => setOverlay({ type: 'detail', item })} />;
  }
  if (overlay.type === 'watch-later') {
    return <WatchLaterScreen onBack={() => setOverlay({ type: 'none' })} onCardClick={(item) => setOverlay({ type: 'detail', item })} />;
  }

  // --- Live screen overlay ---
  if (overlay.type === 'live') {
    return (
      <LiveScreen
        onNotifications={openNotifications}
        onBack={() => setOverlay({ type: 'none' })}
        onPlay={() => {
          const liveDoc: Documentary = {
            id: 'live-player',
            title: 'Wild Tamil Nadu',
            titleTa: 'வனத் தமிழகம்',
            genre: 'Wildlife',
            duration: '45:00',
            durationSec: 2700,
            poster: 'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=800',
            backdrop: 'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=1280',
            year: 2024,
            language: 'Tamil',
            synopsis: 'Live from Anamalai — tracking the tiger population in real time.',
            synopsisTa: 'ஆனைமலையில் இருந்து நேரடி புலி கண்காணிப்பு.',
          };
          setOverlay({ type: 'player', item: liveDoc });
        }}
      />
    );
  }

  return (
    <ScreenShell>
      {overlay.type === 'player' ? (
        <VideoPlayerScreen
          item={overlay.item}
          onBack={() => setOverlay({ type: 'none' })}
          onPlayRelated={(d) => setOverlay({ type: 'player', item: d })}
        />
      ) : (
      <>
      {tab === 'search' && (
        <SearchScreen
          onCardClick={openCard}
          onNotifications={openNotifications}
          onLive={openLive}
        />
      )}
      {tab === 'feed' && (
        <FeedScreen
          onNotifications={openNotifications}
          onLive={openLive}
        />
      )}
      {tab === 'profile' && (
        <ProfileScreen
          onNotifications={openNotifications}
          onBusinessItem={openBusiness}
          onLive={openLive}
          onWatchHistory={() => setOverlay({ type: 'watch-history' })}
          onWatchLater={() => setOverlay({ type: 'watch-later' })}
          onAppSettings={() => setOverlay({ type: 'settings' })}
          onHelp={() => setOverlay({ type: 'help' })}
          onAbout={() => setOverlay({ type: 'about' })}
        />
      )}
      </>
      )}

      <BottomNav active={tab} onChange={(t) => { setOverlay({ type: 'none' }); setTab(t); }} />

      {showSponsorLogin && <SponsorLoginModal onClose={onSponsorLoginClose} onRegister={(role) => { setShowSponsorLogin(false); setOverlay({ type: 'business', key: `${role}-register` }); }} />}
    </ScreenShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
