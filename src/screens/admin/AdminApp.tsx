import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Film, Tv, Building2, CheckSquare,
  Megaphone, BarChart3, TrendingUp, FileText, Settings, ScrollText, LogOut, Tags,
  ChevronLeft, Lock, Clapperboard, Radio, KeyRound, Sparkles, Briefcase, Share2,
  Wallet, IndianRupee,
} from 'lucide-react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminDocumentaries } from './AdminDocumentaries';
import { AdminFeedContent } from './AdminFeedContent';
import { AdminLiveTV } from './AdminLiveTV';
import { AdminSponsors } from './AdminSponsors';
import { AdminCampaignApprovals } from './AdminCampaignApprovals';
import { AdminAdManagement } from './AdminAdManagement';
import { AdminRevenueReports } from './AdminRevenueReports';
import { AdminCMS } from './AdminCMS';
import { AdminSettings } from './AdminSettings';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminBroadcast } from './AdminBroadcast';
import { AdminApiSettings } from './AdminApiSettings';
import { AdminInspireContent } from './AdminInspireContent';
import { AdminFreelancers } from './AdminFreelancers';
import { AdminSocial } from './AdminSocial';
import { AdminPayments } from './AdminPayments';
import { AdminPricing } from './AdminPricing';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminCategories } from './AdminCategories';
import { ToastProvider } from '@/components/admin/Toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export type AdminPage =
  | 'dashboard'
  | 'feed'
  | 'livetv'
  | 'ads'
  | 'sponsors'
  | 'approvals'
  | 'freelancers'
  | 'documentaries'
  | 'inspire'
  | 'categories'
  | 'broadcast'
  | 'social'
  | 'pricing'
  | 'payments'
  | 'revenue'
  | 'analytics'
  | 'users'
  | 'cms'
  | 'apisettings'
  | 'settings'
  | 'audit';

interface NavItem {
  key: AdminPage;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * Nav is grouped and ordered by what the platform actually runs on today:
 * the viewer app currently exposes Search | Feed | Profile plus Live TV, so
 * Feed and Live TV lead. Documentaries and Inspire stay available for when
 * those tabs are switched back on.
 */
const navGroups: NavGroup[] = [
  {
    title: 'Live Now',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'feed', label: 'Feed Content', icon: Clapperboard },
      { key: 'livetv', label: 'Live TV', icon: Tv },
      { key: 'broadcast', label: 'Broadcast Control', icon: Radio },
    ],
  },
  {
    title: 'Advertising',
    items: [
      { key: 'ads', label: 'Ad Management', icon: Megaphone },
      { key: 'sponsors', label: 'Sponsors', icon: Building2 },
      { key: 'approvals', label: 'Campaigns', icon: CheckSquare },
      { key: 'pricing', label: 'Pricing', icon: IndianRupee },
    ],
  },
  {
    title: 'Operations',
    items: [
      { key: 'freelancers', label: 'Freelancers', icon: Briefcase },
      { key: 'payments', label: 'Payments', icon: Wallet },
      { key: 'social', label: 'Social Media', icon: Share2 },
      { key: 'users', label: 'Users', icon: Users },
    ],
  },
  {
    title: 'Library (hidden tabs)',
    items: [
      { key: 'documentaries', label: 'Documentaries', icon: Film },
      { key: 'inspire', label: 'Inspire Content', icon: Sparkles },
      { key: 'categories', label: 'Categories', icon: Tags },
    ],
  },
  {
    title: 'Insights & Config',
    items: [
      { key: 'analytics', label: 'Analytics', icon: TrendingUp },
      { key: 'revenue', label: 'Revenue Reports', icon: BarChart3 },
      { key: 'cms', label: 'CMS Settings', icon: FileText },
      { key: 'apisettings', label: 'API Settings', icon: KeyRound },
      { key: 'settings', label: 'System Settings', icon: Settings },
      { key: 'audit', label: 'Audit Logs', icon: ScrollText },
    ],
  },
];

const allNavItems = navGroups.flatMap((g) => g.items);

export function AdminApp({ onExit }: { onExit: () => void }) {
  const auth = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<AdminPage>('dashboard');
  const [pendingCount, setPendingCount] = useState(0);

  const signedIn = loggedIn || auth.isAdmin;

  // Live badge for campaigns waiting on approval; refreshes when the page changes.
  useEffect(() => {
    if (!signedIn || !supabase) return;
    let cancelled = false;
    supabase
      .from('campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Pending Approval')
      .then(({ count }) => { if (!cancelled) setPendingCount(count ?? 0); });
    return () => { cancelled = true; };
  }, [signedIn, page]);

  if (!signedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} onExit={onExit} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <AdminDashboard />;
      case 'feed': return <AdminFeedContent />;
      case 'livetv': return <AdminLiveTV />;
      case 'broadcast': return <AdminBroadcast />;
      case 'ads': return <AdminAdManagement />;
      case 'sponsors': return <AdminSponsors />;
      case 'approvals': return <AdminCampaignApprovals />;
      case 'pricing': return <AdminPricing />;
      case 'freelancers': return <AdminFreelancers />;
      case 'payments': return <AdminPayments />;
      case 'social': return <AdminSocial />;
      case 'users': return <AdminUsers />;
      case 'documentaries': return <AdminDocumentaries />;
      case 'inspire': return <AdminInspireContent />;
      case 'categories': return <AdminCategories />;
      case 'analytics': return <AdminAnalytics />;
      case 'revenue': return <AdminRevenueReports />;
      case 'cms': return <AdminCMS />;
      case 'apisettings': return <AdminApiSettings />;
      case 'settings': return <AdminSettings />;
      case 'audit': return <AdminAuditLogs />;
      default: return <AdminDashboard />;
    }
  };

  const currentLabel = allNavItems.find((n) => n.key === page)?.label || 'Dashboard';

  return (
    <ToastProvider>
      <div className="min-h-screen bg-vblack text-white flex">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-white/8 bg-vblack/95 h-screen sticky top-0 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vred flex items-center justify-center">
              <Lock size={16} className="text-white" />
            </div>
            <div>
              <div className="font-black text-white text-sm">Vallavan Admin</div>
              <div className="text-[9px] text-vmuted uppercase tracking-wider">Internal Panel</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
            {navGroups.map((group) => (
              <div key={group.title}>
                <div className="px-3 pb-1 text-[9px] uppercase tracking-wider text-vmuted/60 font-bold">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = page === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setPage(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                          isActive
                            ? 'bg-vred/15 text-vred'
                            : 'text-vmuted hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <item.icon size={17} className={isActive ? 'text-vred' : ''} />
                        <span className={isActive ? 'text-vred' : ''}>{item.label}</span>
                        {item.key === 'approvals' && pendingCount > 0 && (
                          <span className="ml-auto px-1.5 py-0.5 rounded-full bg-vgold text-black text-[9px] font-bold">
                            {pendingCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-2 border-t border-white/5">
            <button
              onClick={onExit}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-vmuted hover:bg-white/5 hover:text-white transition"
            >
              <LogOut size={17} /> Exit Admin
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 h-screen overflow-y-auto">
          <header className="sticky top-0 z-20 bg-vblack/85 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-3">
            <button
              onClick={() => (page === 'dashboard' ? onExit() : setPage('dashboard'))}
              className="w-8 h-8 flex items-center justify-center rounded-lg glass active:scale-90"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
            <h1 className="text-lg font-black text-white">{currentLabel}</h1>
            <div className="ml-auto text-xs text-vmuted">{auth.email || 'admin@vallavan.in'}</div>
          </header>
          <div className="p-6">
            {renderPage()}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
