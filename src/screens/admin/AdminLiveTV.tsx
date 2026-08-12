import { useState, useEffect } from 'react';
import { Plus, Tv, MoreVertical } from 'lucide-react';
import { liveSchedule as mockSchedule } from '@/data/mockData';
import { fetchLiveSchedule } from '@/services/live';

export function AdminLiveTV() {
  const [liveSchedule, setLiveSchedule] = useState(mockSchedule);

  useEffect(() => {
    fetchLiveSchedule().then(setLiveSchedule);
  }, []);

  return (
    <div className="space-y-4">
      {/* Channel info */}
      <div className="p-4 rounded-xl glass flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-vred flex items-center justify-center">
          <Tv size={22} className="text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-black text-white">VALLAVAN TV</h3>
          <p className="text-xs text-vmuted">Live 24/7 · 1,240 watching now</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-bold">On Air</span>
      </div>

      {/* Schedule editor */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Today's Program Schedule</h3>
        <button className="px-3 py-1.5 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
          <Plus size={14} /> Add Slot
        </button>
      </div>

      <div className="rounded-xl glass overflow-hidden divide-y divide-white/5">
        {liveSchedule.map((slot) => (
          <div key={slot.id} className="flex items-center gap-4 p-3.5 hover:bg-white/5 transition">
            <div className="w-20 text-center">
              <div className="text-sm font-bold text-white">{slot.time}</div>
              <div className="text-[10px] text-vmuted">{slot.duration}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{slot.title}</div>
              <div className="text-[11px] font-tamil text-vmuted truncate">{slot.titleTa}</div>
            </div>
            {slot.isLive && (
              <span className="px-2 py-0.5 rounded-full bg-vred text-white text-[10px] font-bold">LIVE</span>
            )}
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
              <MoreVertical size={14} className="text-vmuted" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
