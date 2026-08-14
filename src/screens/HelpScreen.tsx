import { Mail, LifeBuoy, Bot } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { SUPPORT_EMAIL } from '@/services/chat';

/**
 * Support = AI chatbot + email only (FIX 5). No phone, no WhatsApp anywhere.
 * The primary support entry point is the AI Assistant (see AIChatbot); this
 * static screen is kept as a lightweight fallback.
 */
export function HelpScreen({ onBack, onChat }: { onBack: () => void; onChat?: () => void }) {
  const faqs = [
    { q: 'Is Vallavan free?', a: 'Yes — all documentaries are free to watch, supported by sponsors (AVOD).' },
    { q: 'Do I need an account?', a: 'No. Viewing needs no login. Watch History & Watch Later are saved on your device.' },
    { q: 'How do I advertise?', a: 'Tap Profile → Become a Sponsor to see pricing and sign up. Manage campaigns in the app.' },
  ];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Help & Support" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[600px] mx-auto w-full space-y-5">
        <section className="p-4 rounded-card glass-strong flex items-center gap-3">
          <LifeBuoy size={22} className="text-vred" />
          <div>
            <div className="text-sm font-black text-white">Our AI assistant can help you 24/7</div>
            <div className="text-[11px] text-vmuted">Ask about advertising, freelancing, or the app.</div>
          </div>
        </section>

        <section className="rounded-card glass overflow-hidden divide-y divide-white/5">
          {onChat && (
            <button onClick={onChat} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <Bot size={18} className="text-vgold" />
              <div className="flex-1"><div className="text-sm font-semibold text-white">AI Assistant</div><div className="text-[11px] text-vmuted">Chat now</div></div>
            </button>
          )}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 px-4 py-3.5">
            <Mail size={18} className="text-vgold" />
            <div className="flex-1"><div className="text-sm font-semibold text-white">Email</div><div className="text-[11px] text-vmuted">{SUPPORT_EMAIL}</div></div>
          </a>
        </section>

        <section>
          <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2 px-1">FAQ</h3>
          <div className="space-y-2">
            {faqs.map((f) => (
              <div key={f.q} className="p-3.5 rounded-card glass">
                <div className="text-sm font-bold text-white">{f.q}</div>
                <div className="text-[12px] text-vmuted mt-1 leading-relaxed">{f.a}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="h-8" />
    </div>
  );
}
