import { MapPin, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { useState } from 'react';
import { tamilNaduDistricts } from '@/data/mockData';

export function GeoTargetingScreen({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>(['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli']);

  const toggle = (d: string) => {
    setSelected((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]));
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Geo Targeting" onBack={onBack} />

      <div className="px-4 mt-4">
        {/* Map placeholder */}
        <div className="relative aspect-square rounded-card glass overflow-hidden mb-4">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin size={36} className="text-vred mx-auto mb-2" />
              <p className="text-sm font-bold text-white">Tamil Nadu</p>
              <p className="text-xs text-vmuted mt-1">{selected.length} districts selected</p>
            </div>
          </div>
          {/* mock dots */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-vred/60 animate-pulse"
              style={{
                top: `${20 + (i * 37) % 60}%`,
                left: `${15 + (i * 53) % 70}%`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Select Districts</h3>
          <div className="flex gap-2">
            <button onClick={() => setSelected(tamilNaduDistricts)} className="text-[10px] font-bold text-vred">
              Select All
            </button>
            <button onClick={() => setSelected([])} className="text-[10px] font-bold text-vmuted">
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {tamilNaduDistricts.map((d) => {
            const sel = selected.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggle(d)}
                className={`px-2 py-2.5 rounded-lg text-[10px] font-bold transition active:scale-95 flex items-center justify-center gap-1 ${
                  sel ? 'bg-vred text-white' : 'glass text-vmuted'
                }`}
              >
                {sel && <Check size={10} />}
                {d}
              </button>
            );
          })}
        </div>

        <button
          onClick={onBack}
          className="w-full mt-5 py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition shadow-glow"
        >
          Save Targeting
        </button>
      </div>

      <div className="h-8" />
    </div>
  );
}
