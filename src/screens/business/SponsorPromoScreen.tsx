import { useState, useEffect } from 'react';
import { Megaphone, MapPin, Share2, TrendingUp, Check } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { fetchPricingRates, fetchInspirePackages, type PricingRate, type InspirePackage } from '@/services/pricing';

export function SponsorPromoScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const [rates, setRates] = useState<PricingRate[]>([]);
  const [packages, setPackages] = useState<InspirePackage[]>([]);

  useEffect(() => {
    fetchPricingRates().then(setRates);
    fetchInspirePackages().then(setPackages);
  }, []);

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Become a Sponsor" onBack={onBack} />

      <div className="px-4 max-w-[720px] mx-auto w-full">
        {/* Hero */}
        <section className="mt-4 p-5 rounded-card bg-gradient-to-br from-vred/20 via-vblack to-vblack border border-vred/20">
          <Megaphone size={28} className="text-vred" />
          <h1 className="text-2xl font-black text-white mt-3 leading-tight">Advertise on Vallavan</h1>
          <p className="text-sm text-vmuted mt-1">Tamil Nadu's documentary platform — reach engaged viewers, district by district.</p>
          <button onClick={onStart} className="mt-4 px-5 py-2.5 rounded-full bg-vred text-white text-sm font-bold active:scale-95 shadow-glow">Start Now</button>
        </section>

        {/* Why */}
        <section className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, t: 'Real Reach', s: 'Engaged Tamil audience' },
            { icon: MapPin, t: 'Geo-Targeted', s: 'Pick your districts' },
            { icon: Share2, t: 'Multi-Platform', s: 'App + social media' },
          ].map((w) => (
            <div key={w.t} className="p-3.5 rounded-card glass">
              <w.icon size={18} className="text-vgold" />
              <div className="text-sm font-bold text-white mt-2">{w.t}</div>
              <div className="text-[10px] text-vmuted">{w.s}</div>
            </div>
          ))}
        </section>

        {/* Display ad pricing */}
        <section className="mt-6">
          <h2 className="text-base font-black text-white mb-1">Display Ads — pay per day</h2>
          <p className="text-[11px] text-vmuted mb-3">Visible all day on app + social, with target impressions and a CTA.</p>
          <div className="grid grid-cols-2 gap-3">
            {rates.map((r) => (
              <div key={r.coverage} className="p-4 rounded-card glass border border-white/8">
                <div className="text-[11px] text-vmuted">{r.coverage}</div>
                <div className="text-2xl font-black text-vgold mt-1">₹{r.dailyRateRupees}<span className="text-xs text-vmuted font-normal">/day</span></div>
                <div className="text-[10px] text-vmuted mt-1">{r.districtsCount} district{r.districtsCount > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Inspire packages */}
        {packages.length > 0 && (
          <section className="mt-6">
            <h2 className="text-base font-black text-white mb-1">Inspire PR Video</h2>
            <p className="text-[11px] text-vmuted mb-3">A produced feature, sponsor-branded throughout — no other ads.</p>
            <div className="space-y-3">
              {packages.map((p) => (
                <div key={p.id} className="p-4 rounded-card glass border border-vgold/25">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-white">{p.name} · {p.durationMin} min</div>
                    <div className="text-lg font-black text-vgold">₹{p.priceRupees.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Feat text={`₹${p.freeCreditRupees.toLocaleString('en-IN')} free wallet credit`} />
                    <Feat text="Sponsor branded throughout · social posts" />
                    {p.includesMagazine && <Feat text="Full-page magazine ad + 'Vallavan Recommends' badge" />}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <button onClick={onStart} className="w-full mt-6 py-3.5 rounded-full bg-vgold text-black font-black text-sm active:scale-95">Start Now — Create Your Account</button>
        <div className="h-8" />
      </div>
    </div>
  );
}

function Feat({ text }: { text: string }) {
  return <div className="flex items-center gap-2 text-[12px] text-white/85"><Check size={13} className="text-green-400 flex-shrink-0" /> {text}</div>;
}
