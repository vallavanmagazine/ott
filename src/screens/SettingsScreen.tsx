import { useState } from 'react';
import { Globe, Bell, MapPin, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { getPrefs, setPrefs } from '@/lib/prefs';
import { tamilNaduDistricts } from '@/data/mockData';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [prefs, setLocal] = useState(getPrefs());
  const update = (patch: Partial<typeof prefs>) => setLocal(setPrefs(patch));

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="App Settings" onBack={onBack} />

      <div className="px-4 mt-4 max-w-[600px] mx-auto w-full space-y-5">
        {/* Language */}
        <section>
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2 flex items-center gap-1.5"><Globe size={12} /> Language</h3>
          <div className="flex gap-2">
            {([['en', 'English'], ['ta', 'தமிழ்']] as const).map(([code, label]) => (
              <button
                key={code}
                onClick={() => update({ language: code })}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition active:scale-95 ${prefs.language === code ? 'bg-vred text-white' : 'glass text-vmuted'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2 flex items-center gap-1.5"><Bell size={12} /> Notifications</h3>
          <button onClick={() => update({ notifications: !prefs.notifications })} className="w-full flex items-center justify-between p-3.5 rounded-xl glass">
            <span className="text-sm font-semibold text-white">Push & in-app alerts</span>
            <div className={`w-11 h-6 rounded-full p-0.5 transition ${prefs.notifications ? 'bg-vred' : 'bg-white/15'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition ${prefs.notifications ? 'translate-x-5' : ''}`} />
            </div>
          </button>
        </section>

        {/* District */}
        <section>
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2 flex items-center gap-1.5"><MapPin size={12} /> Your District</h3>
          <p className="text-[11px] text-vmuted mb-2">Used to show locally relevant ads &amp; weather.</p>
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {tamilNaduDistricts.map((d) => (
              <button
                key={d}
                onClick={() => update({ district: d })}
                className={`px-2 py-2 rounded-lg text-[10px] font-bold transition active:scale-95 flex items-center justify-center gap-1 ${prefs.district === d ? 'bg-vred text-white' : 'glass text-vmuted'}`}
              >
                {prefs.district === d && <Check size={10} />} {d}
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="h-8" />
    </div>
  );
}
