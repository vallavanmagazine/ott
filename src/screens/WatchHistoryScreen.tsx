import { useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { ContentCard } from '@/components/ContentCard';
import { getWatchHistory, clearHistory } from '@/lib/library';
import type { Documentary } from '@/data/mockData';

export function WatchHistoryScreen({ onBack, onCardClick }: { onBack: () => void; onCardClick: (d: Documentary) => void }) {
  const [items, setItems] = useState<Documentary[]>(getWatchHistory());

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader
        title="Watch History"
        onBack={onBack}
        rightAction={items.length > 0 ? (
          <button onClick={() => { clearHistory(); setItems([]); }} className="flex items-center gap-1 text-[11px] font-bold text-vmuted">
            <Trash2 size={13} /> Clear
          </button>
        ) : undefined}
      />
      <div className="px-4 mt-4 max-w-[900px] mx-auto w-full">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <History size={32} className="text-vmuted mb-3" />
            <p className="text-sm font-semibold text-white">Nothing watched yet</p>
            <p className="text-xs text-vmuted mt-1">Titles you play will appear here.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-vmuted mb-3">{items.length} titles</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {items.map((d) => <div key={d.id} className="w-full"><ContentCard item={d} onClick={() => onCardClick(d)} /></div>)}
            </div>
          </>
        )}
      </div>
      <div className="h-8" />
    </div>
  );
}
