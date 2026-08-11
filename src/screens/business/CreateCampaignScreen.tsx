import { useState } from 'react';
import { Check, ChevronRight, Upload, Sparkles, MapPin, IndianRupee, ArrowLeft } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { tamilNaduDistricts } from '@/data/mockData';

const steps = ['Campaign Name', 'Creative', 'Geo Targeting', 'Budget', 'Review'];

export function CreateCampaignScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['Chennai', 'Coimbatore', 'Madurai']);
  const [budget, setBudget] = useState('15000');

  const toggleDistrict = (d: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const next = () => step < steps.length - 1 && setStep(step + 1);
  const prev = () => step > 0 && setStep(step - 1);

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Create Campaign" onBack={onBack} />

      {/* Stepper */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4 max-w-[600px] mx-auto w-full">
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition ${i <= step ? 'bg-vred text-white' : 'bg-white/10 text-vmuted'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-vred' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs font-bold text-vmuted">{steps[step]}</div>
      </div>

      {/* Step content */}
      <div className="px-4 sm:px-6 lg:px-8 mt-5 max-w-[600px] mx-auto w-full pb-28">
        {step === 0 && (
          <div className="animate-fade-in">
            <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Campaign Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer Tea Promotion" className="w-full mt-2 px-4 py-3.5 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
            <label className="block mt-4 text-[10px] tracking-wider uppercase text-vmuted font-bold">Campaign Objective</label>
            <div className="mt-2 space-y-2">
              {['Brand Awareness', 'Drive Sales', 'App Installs', 'Event Promotion'].map((o, i) => (
                <button key={o} className={`w-full p-3.5 rounded-xl text-left flex items-center justify-between transition active:scale-95 ${i === 0 ? 'glass-strong border border-vred/50' : 'glass'}`}>
                  <span className="text-sm font-semibold text-white">{o}</span>
                  {i === 0 && <Check size={16} className="text-vred" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Upload Creative</label>
            <div className="mt-2 border-2 border-dashed border-white/15 rounded-xl p-8 flex flex-col items-center justify-center">
              <Upload size={28} className="text-vmuted mb-2" />
              <p className="text-sm font-semibold text-white">Upload Image / Video</p>
              <p className="text-[11px] text-vmuted mt-1">PNG, JPG, MP4 · max 10MB</p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] tracking-wider uppercase text-vmuted font-bold">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button className="w-full mt-4 py-3.5 rounded-xl bg-vred/20 border border-vred/40 text-vred font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition">
              <Sparkles size={16} /> Generate with AI Studio
            </button>
            <div className="mt-4 aspect-[16/7] rounded-xl glass flex items-center justify-center">
              <span className="text-xs text-vmuted">Creative preview will appear here</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold flex items-center gap-1.5">
              <MapPin size={12} /> Select Districts
            </label>
            <p className="text-[11px] text-vmuted mt-1">{selectedDistricts.length} districts selected</p>
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {tamilNaduDistricts.map((d) => {
                const sel = selectedDistricts.includes(d);
                return (
                  <button key={d} onClick={() => toggleDistrict(d)} className={`px-2 py-2 rounded-lg text-[10px] font-bold transition active:scale-95 ${sel ? 'bg-vred text-white' : 'glass text-vmuted'}`}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold flex items-center gap-1.5">
              <IndianRupee size={12} /> Campaign Budget
            </label>
            <div className="mt-3 p-4 rounded-xl glass text-center">
              <div className="text-3xl font-black text-vgold">₹{Number(budget).toLocaleString('en-IN')}</div>
              <input type="range" min="5000" max="100000" step="1000" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full mt-4 accent-vred" />
              <div className="flex justify-between text-[10px] text-vmuted mt-1">
                <span>₹5K</span><span>₹1L</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl glass">
                <div className="text-[10px] text-vmuted">Est. Impressions</div>
                <div className="text-lg font-black text-white">~{(Number(budget) * 8).toLocaleString('en-IN')}</div>
              </div>
              <div className="p-3 rounded-xl glass">
                <div className="text-[10px] text-vmuted">Est. Clicks</div>
                <div className="text-lg font-black text-white">~{Math.floor(Number(budget) * 0.3).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in space-y-3">
            <ReviewRow label="Campaign Name" value={name || 'Summer Tea Promotion'} />
            <ReviewRow label="Objective" value="Brand Awareness" />
            <ReviewRow label="Creative" value="AI-generated banner" />
            <ReviewRow label="Geo Targeting" value={`${selectedDistricts.length} districts`} />
            <ReviewRow label="Budget" value={`₹${Number(budget).toLocaleString('en-IN')}`} />
            <ReviewRow label="Duration" value="30 days" />
            <ReviewRow label="Status" value="Pending Approval" highlight />
            <div className="mt-4 p-3.5 rounded-xl bg-vgold/10 border border-vgold/30">
              <p className="text-[11px] text-vgold font-semibold">Your campaign will be reviewed by our team within 24 hours.</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons — responsive, no max-w-[430px] */}
      <div className="fixed bottom-0 left-0 right-0 p-4 glass-strong border-t border-white/8 safe-bottom">
        <div className="flex gap-2 max-w-[600px] mx-auto w-full">
          {step > 0 && (
            <button onClick={prev} className="flex-1 py-3 rounded-full glass text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-1.5">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button onClick={step === steps.length - 1 ? onBack : next} className="flex-1 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition flex items-center justify-center gap-1.5 shadow-glow">
            {step === steps.length - 1 ? 'Submit Campaign' : 'Continue'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass">
      <span className="text-[11px] text-vmuted">{label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-vgold' : 'text-white'}`}>{value}</span>
    </div>
  );
}
