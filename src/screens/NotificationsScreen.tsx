import { useState, useEffect } from 'react';
import { X, Tv, PlayCircle, Tag, Info } from 'lucide-react';
import { notifications as mockNotifications } from '@/data/mockData';
import { fetchNotifications } from '@/services/notifications';

const typeIcons: Record<string, typeof Tv> = {
  episode: PlayCircle,
  live: Tv,
  sponsor: Tag,
  system: Info,
};

const typeColors: Record<string, string> = {
  episode: '#D32F2F',
  live: '#D32F2F',
  sponsor: '#D4AF37',
  system: '#1565C0',
};

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const [notifications, setNotifications] = useState(mockNotifications);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  const today = notifications.filter((n) => n.unread);
  const earlier = notifications.filter((n) => !n.unread);

  const renderGroup = (label: string, items: typeof notifications) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-4">
        <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2 px-1">{label}</h3>
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = typeIcons[n.type] || Info;
            const color = typeColors[n.type] || '#666';
            return (
              <button
                key={n.id}
                className={`w-full flex items-start gap-3 p-3.5 rounded-card text-left transition active:scale-[0.98] ${
                  n.unread ? 'glass-strong' : 'glass'
                }`}
              >
                <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${color}25` }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{n.title}</span>
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-vred flex-shrink-0" />}
                  </div>
                  {n.titleTa && <p className="text-[11px] font-tamil text-vmuted">{n.titleTa}</p>}
                  <p className="text-xs text-vmuted mt-1 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-vmuted/70 mt-1.5">{n.time}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-vblack flex flex-col safe-top">
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-white/5 flex items-center gap-3 max-w-[700px] mx-auto w-full">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90">
          <X size={18} className="text-white" />
        </button>
        <h1 className="text-base font-black text-white flex-1">Notifications</h1>
        <button className="text-[11px] font-bold text-vred">Mark all read</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 max-w-[700px] mx-auto w-full">
        {renderGroup('Today', today)}
        {renderGroup('Earlier', earlier)}
      </div>
    </div>
  );
}
