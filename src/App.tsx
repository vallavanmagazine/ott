import { useState, useEffect } from 'react';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { ScreenShell } from '@/components/ScreenShell';
import { SplashScreen } from '@/screens/SplashScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ExploreScreen } from '@/screens/ExploreScreen';
import { LiveScreen } from '@/screens/LiveScreen';
import { FeedScreen } from '@/screens/FeedScreen';
import { InspireScreen } from '@/screens/InspireScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { DocumentaryDetailScreen } from '@/screens/DocumentaryDetailScreen';
import { VideoPlayerScreen } from '@/screens/VideoPlayerScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { SponsorDashboard } from '@/screens/business/SponsorDashboard';
import { CreateCampaignScreen } from '@/screens/business/CreateCampaignScreen';
import { AIStudioScreen } from '@/screens/business/AIStudioScreen';
import { CreativeLibraryScreen } from '@/screens/business/CreativeLibraryScreen';
import { MyCampaignsScreen } from '@/screens/business/MyCampaignsScreen';
import { GeoTargetingScreen } from '@/screens/business/GeoTargetingScreen';
import { CampaignAnalyticsScreen } from '@/screens/business/CampaignAnalyticsScreen';
import { BillingScreen } from '@/screens/business/BillingScreen';
import { AIAssistantScreen } from '@/screens/business/AIAssistantScreen';
import { AdminApp } from '@/screens/admin/AdminApp';
import { SponsorLoginModal } from '@/components/SponsorLoginModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import type { Documentary, InspireItem } from '@/data/mockData';

type Overlay =
  | { type: 'none' }
  | { type: 'detail'; item: Documentary }
  | { type: 'player'; item: Documentary }
  | { type: 'search' }
  | { type: 'notifications' }
  | { type: 'business'; key: string }
  | { type: 'admin' }
  | { type: 'live' };

const SPONSOR_ITEMS = ['sponsor', 'create-campaign', 'my-campaigns', 'campaign-analytics', 'billing'];

function AppInner() {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<TabKey>('home');
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

    switch (overlay.key) {
      case 'sponsor-dashboard':
      case 'sponsor':
        return <SponsorDashboard onBack={back} onNavigate={navigate} />;
      case 'create-campaign':
        return <CreateCampaignScreen onBack={back} />;
      case 'ai-studio':
        return <AIStudioScreen onBack={back} />;
      case 'creative-library':
        return <CreativeLibraryScreen onBack={back} />;
      case 'my-campaigns':
        return <MyCampaignsScreen onBack={back} />;
      case 'geo-targeting':
        return <GeoTargetingScreen onBack={back} />;
      case 'campaign-analytics':
        return <CampaignAnalyticsScreen onBack={back} />;
      case 'billing':
        return <BillingScreen onBack={back} />;
      case 'ai-assistant':
        return <AIAssistantScreen onBack={back} />;
      default:
        return <SponsorDashboard onBack={back} onNavigate={navigate} />;
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

  // --- Video player ---
  if (overlay.type === 'player') {
    return <VideoPlayerScreen item={overlay.item} onBack={() => setOverlay({ type: 'detail', item: overlay.item })} />;
  }

  // --- Search overlay ---
  if (overlay.type === 'search') {
    return (
      <SearchScreen
        onBack={() => setOverlay({ type: 'none' })}
        onCardClick={(item) => setOverlay({ type: 'detail', item })}
      />
    );
  }

  // --- Main app with tabs ---
  const openCard = (item: Documentary) => setOverlay({ type: 'detail', item });
  const openInspireCard = (item: InspireItem) => {
    const doc: Documentary = {
      id: item.id,
      title: item.title,
      titleTa: item.titleTa,
      genre: item.category as Documentary['genre'],
      duration: item.duration,
      durationSec: parseInt(item.duration.replace(/:/g, '')) * 60 || 300,
      poster: item.poster,
      backdrop: item.poster,
      year: 2024,
      language: 'Tamil',
      synopsis: item.quote || 'Short-form inspirational content.',
      synopsisTa: 'ஊக்கமூட்டும் குறுக்கட்டி உள்ளடக்கம்.',
      director: item.attribution,
      cast: [],
    };
    setOverlay({ type: 'detail', item: doc });
  };
  const openSearch = () => setOverlay({ type: 'search' });
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
      {tab === 'home' && (
        <HomeScreen
          onSearch={openSearch}
          onNotifications={openNotifications}
          onCardClick={openCard}
          onSeeAll={() => setTab('explore')}
          onWatchLive={openLive}
          onLive={openLive}
        />
      )}
      {tab === 'feed' && (
        <FeedScreen />
      )}
      {tab === 'explore' && (
        <ExploreScreen
          onSearch={openSearch}
          onNotifications={openNotifications}
          onCardClick={openCard}
          onSeeAll={() => {}}
          onLive={openLive}
        />
      )}
      {tab === 'inspire' && (
        <InspireScreen
          onNotifications={openNotifications}
          onCardClick={openInspireCard}
          onLive={openLive}
        />
      )}
      {tab === 'profile' && (
        <ProfileScreen
          onNotifications={openNotifications}
          onSettings={() => {}}
          onBusinessItem={openBusiness}
          onLive={openLive}
        />
      )}

      <BottomNav active={tab} onChange={setTab} />

      {/* Hidden admin access via long-press on logo or hash — add a subtle admin link in profile */}
      {showSponsorLogin && <SponsorLoginModal onClose={onSponsorLoginClose} />}
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
