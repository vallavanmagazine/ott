import { Mail, LifeBuoy, Star, Briefcase } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { SUPPORT_EMAIL } from '@/services/chat';

/**
 * Help & Support — a simple FAQ page (FIX 2). The AI assistant lives INSIDE the
 * Sponsor/Freelancer dashboards (mobile app), not here. Support here is FAQ +
 * email; no phone, no WhatsApp.
 */
export function HelpScreen({ onBack }: { onBack: () => void }) {
  const faqs = [
    { q: 'Is Vallavan free?', a: 'Yes — all documentaries are free to watch, supported by sponsors (AVOD).' },
    { q: 'Do I need an account?', a: 'No. Viewing needs no login. Watch History & Watch Later are saved on your device.' },
    { q: 'How do I advertise?', a: 'Tap Profile → Become a Sponsor to see pricing and register. Manage campaigns in the app.' },
    { q: 'How do I freelance with Vallavan?', a: 'Tap Profile → Join as Freelancer, register, and complete your application. Approved freelancers work from the app.' },
  ];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Help & Support" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[600px] mx-auto w-full space-y-5">
        <section className="p-4 rounded-card glass-strong flex items-center gap-3">
          <LifeBuoy size={22} className="text-vred" />
          <div>
            <div className="text-sm font-black text-white">We're here to help</div>
            <div className="text-[11px] text-vmuted">Browse common questions, or email us.</div>
          </div>
        </section>

        <section className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Star size={18} className="text-vgold" />
            <div className="flex-1"><div className="text-sm font-semibold text-white">Sponsor support</div><div className="text-[11px] text-vmuted">Log in to your Sponsor Dashboard (in the app) — the AI Ad Assistant helps there.</div></div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Briefcase size={18} className="text-vgold" />
            <div className="flex-1"><div className="text-sm font-semibold text-white">Freelancer support</div><div className="text-[11px] text-vmuted">Log in to your Freelancer Dashboard (in the app) — the AI Assistant helps there.</div></div>
          </div>
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
