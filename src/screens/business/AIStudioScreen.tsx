import { useState } from 'react';
import { Sparkles, Image, Type, FileText, Wand2 } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { generateAdCreative, type AdCreativeResult } from '@/services/ai';

export function AIStudioScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<'ad' | 'banner' | 'caption'>('ad');
  const [prompt, setPrompt] = useState('');
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<AdCreativeResult | null>(null);

  const handleGenerate = async () => {
    setAiResult(null);
    if (tab === 'ad') {
      setGenerating(true);
      try {
        const res = await generateAdCreative({ product: prompt, language: 'Bilingual' });
        setAiResult(res);
      } catch (e) {
        // Backend/Anthropic not configured — show the template preview + a hint.
        console.warn(e);
      } finally {
        setGenerating(false);
      }
    }
    setGenerated(true);
  };

  const tabs = [
    { key: 'ad' as const, label: 'Ad Generation', icon: Sparkles },
    { key: 'banner' as const, label: 'Banner', icon: Image },
    { key: 'caption' as const, label: 'Captions', icon: Type },
  ];

  const placeholders: Record<typeof tab, string> = {
    ad: 'e.g. "Eco-friendly Tamil tea brand ad for young professionals"',
    banner: 'e.g. "Festive sale banner for Kanchipuram silk sarees"',
    caption: 'e.g. "Catchy Tamil + English caption for electric scooter campaign"',
  };

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="AI Studio" onBack={onBack} />

      <div className="px-4 mt-4">
        <p className="text-xs text-vmuted mb-3">
          Generate ads, banners, and captions with AI. Tamil + English support.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-full glass">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setGenerated(false); }}
              className={`flex-1 py-2 rounded-full text-[11px] font-bold transition flex items-center justify-center gap-1.5 ${
                tab === t.key ? 'bg-vred text-white' : 'text-vmuted'
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Prompt input */}
        <div className="mt-4">
          <label className="text-[10px] tracking-wider uppercase text-vmuted font-bold">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholders[tab]}
            rows={3}
            className="w-full mt-2 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={prompt.length < 3 || generating}
          className="w-full mt-3 py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition disabled:opacity-40 shadow-glow flex items-center justify-center gap-2"
        >
          <Wand2 size={16} /> {generating ? 'Generating…' : 'Generate'}
        </button>

        {/* Preview area */}
        {generated ? (
          <div className="mt-5 animate-slide-up">
            <div className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2">Preview</div>

            {tab === 'ad' && (
              <div className="relative aspect-[16/9] rounded-card overflow-hidden border border-vgold/30">
                <div className="absolute inset-0 bg-gradient-to-br from-vred/30 via-vblack to-vblack" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                  <span className="px-2 py-0.5 bg-vgold rounded text-[9px] font-black uppercase text-black self-start">
                    AI Generated
                  </span>
                  <div>
                    <h3 className="text-base font-black text-white">{aiResult?.headline || prompt.slice(0, 40) || 'Your Ad Headline Here'}</h3>
                    <p className="text-xs text-vmuted mt-1">{aiResult?.body || 'AI-generated copy based on your prompt.'}</p>
                    <div className="mt-2 inline-flex px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold">{aiResult?.cta || 'Learn More'}</div>
                  </div>
                  {!aiResult && (
                    <span className="absolute bottom-1 right-2 text-[8px] text-vmuted/70">Template preview — configure ANTHROPIC_API_KEY + backend for live AI</span>
                  )}
                </div>
              </div>
            )}

            {tab === 'banner' && (
              <div className="relative aspect-[16/7] rounded-card overflow-hidden border border-vgold/30">
                <div className="absolute inset-0 bg-gradient-to-r from-vred/20 via-vblack to-vgold/15" />
                <div className="absolute inset-0 p-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-black text-white">{prompt.slice(0, 30) || 'Festive Banner'}</div>
                    <div className="text-xs text-vgold mt-1">Special Offer</div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'caption' && (
              <div className="p-4 rounded-card glass border border-vgold/30">
                <div className="flex items-start gap-2">
                  <FileText size={16} className="text-vgold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-white leading-relaxed">
                      "பசுமையான தேநீர், தூய இயற்கை — Pure Nilgiri tea, nature's gift in every sip. இன்றே ஆர்டர் செய்யுங்கள்! 🌿"
                    </p>
                    <p className="text-[11px] text-vmuted mt-2">#TamilTea #Natural #VallavanAds</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold active:scale-95">
                Save to Library
              </button>
              <button
                onClick={() => setGenerated(false)}
                className="flex-1 py-2.5 rounded-full bg-vred text-white text-xs font-bold active:scale-95"
              >
                Regenerate
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 aspect-[16/9] rounded-card glass flex items-center justify-center">
            <div className="text-center">
              <Sparkles size={28} className="text-vmuted mx-auto mb-2" />
              <p className="text-xs text-vmuted">Enter a prompt and tap Generate</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
