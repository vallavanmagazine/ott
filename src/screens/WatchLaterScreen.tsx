import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { ContentCard } from '@/components/ContentCard';
import { getWatchLater } from '@/lib/library';
import type { Documentary } from '@/data/mockData';

export function WatchLaterScreen({ onBack, onCardClick }: { onBack: () => void; onCardClick: (d: Documentary) => void }) {
  const [items] = useState<Documentary[]>(getWatchLater());

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Watch Later" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[900px] mx-auto w-full">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Bookmark size={32} className="text-vmuted mb-3" />
            <p className="text-sm font-semibold text-white">No saved titles</p>
            <p className="text-xs text-vmuted mt-1">Tap the + on any documentary to save it here.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-vmuted mb-3">{items.length} saved</p>
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
