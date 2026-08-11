import { Download, MoreVertical } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { ads, pexelsUrl } from '@/data/mockData';

export function CreativeLibraryScreen({ onBack }: { onBack: () => void }) {
  const creatives = [
    ...ads,
    { id: 'cr1', sponsor: 'A2B Foods', sponsorLogo: '', headline: 'Festive Thali Special', body: '', cta: 'Order Now', bgImage: 'img/723198/pexels-photo-723198.jpeg', accent: '#EF6C00' },
    { id: 'cr2', sponsor: 'Chennai Motors', sponsorLogo: '', headline: 'EV Test Ride Weekend', body: '', cta: 'Book Now', bgImage: 'img/3802510/pexels-photo-3802510.jpeg', accent: '#1565C0' },
    { id: 'cr3', sponsor: 'Tamil Tea Co.', sponsorLogo: '', headline: 'Monsoon Brew Collection', body: '', cta: 'Shop', bgImage: 'img/1638280/pexels-photo-1638280.jpeg', accent: '#2E7D32' },
  ];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Creative Library" onBack={onBack} />

      <div className="px-4 mt-4">
        <p className="text-xs text-vmuted mb-3">{creatives.length} saved creatives</p>
        <div className="grid grid-cols-2 gap-3">
          {creatives.map((c) => (
            <div key={c.id} className="relative rounded-card overflow-hidden border border-white/8 card-shadow">
              <div className="relative aspect-[4/5]">
                <img src={pexelsUrl(c.bgImage, 400)} alt={c.sponsor} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-vgold/90 rounded text-[7px] font-black uppercase text-black">
                  Saved
                </div>
                <button className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <MoreVertical size={12} className="text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="text-[9px] text-vgold font-bold">{c.sponsor}</div>
                  <div className="text-[12px] font-bold text-white leading-tight line-clamp-2">{c.headline}</div>
                  <button className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-vmuted">
                    <Download size={10} /> Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
}
