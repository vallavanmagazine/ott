import { useState } from 'react';
import {
  LayoutDashboard, Users, Film, Tv, Building2, CheckSquare,
  Megaphone, BarChart3, FileText, Settings, ScrollText, LogOut,
  ChevronLeft, Lock, Clapperboard,
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
import { useAuth } from '@/context/AuthContext';

export type AdminPage =
  | 'dashboard'
  | 'users'
  | 'documentaries'
  | 'feed'
  | 'livetv'
  | 'sponsors'
  | 'approvals'
  | 'ads'
  | 'revenue'
  | 'cms'
  | 'settings'
  | 'audit';

const navItems: { key: AdminPage; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'documentaries', label: 'Documentaries', icon: Film },
  { key: 'feed', label: 'Feed Content', icon: Clapperboard },
  { key: 'livetv', label: 'Live TV', icon: Tv },
  { key: 'sponsors', label: 'Sponsors', icon: Building2 },
  { key: 'approvals', label: 'Campaign Approvals', icon: CheckSquare },
  { key: 'ads', label: 'Ad Management', icon: Megaphone },
  { key: 'revenue', label: 'Revenue Reports', icon: BarChart3 },
  { key: 'cms', label: 'CMS', icon: FileText },
  { key: 'settings', label: 'System Settings', icon: Settings },
  { key: 'audit', label: 'Audit Logs', icon: ScrollText },
];

export function AdminApp({ onExit }: { onExit: () => void }) {
  const auth = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState<AdminPage>('dashboard');

  if (!loggedIn && !auth.isAdmin) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} onExit={onExit} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <AdminDashboard />;
      case 'users': return <AdminUsers />;
      case 'documentaries': return <AdminDocumentaries />;
      case 'feed': return <AdminFeedContent />;
      case 'livetv': return <AdminLiveTV />;
      case 'sponsors': return <AdminSponsors />;
      case 'approvals': return <AdminCampaignApprovals />;
      case 'ads': return <AdminAdManagement />;
      case 'revenue': return <AdminRevenueReports />;
      case 'cms': return <AdminCMS />;
      case 'settings': return <AdminSettings />;
      case 'audit': return <AdminAuditLogs />;
      default: return <AdminDashboard />;
    }
  };

  const currentLabel = navItems.find((n) => n.key === page)?.label || 'Dashboard';

  return (
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

        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
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
                {item.key === 'approvals' && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full bg-vgold text-black text-[9px] font-bold">3</span>
                )}
              </button>
            );
          })}
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
            onClick={() => page === 'dashboard' ? onExit() : setPage('dashboard')}
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
  );
}
