import { Mail, Phone, MessageCircle, LifeBuoy } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';

export function HelpScreen({ onBack }: { onBack: () => void }) {
  const faqs = [
    { q: 'Is Vallavan free?', a: 'Yes — all documentaries are free to watch, supported by sponsors (AVOD).' },
    { q: 'Do I need an account?', a: 'No. Viewing needs no login. Watch History & Watch Later are saved on your device.' },
    { q: 'How do I advertise?', a: 'Tap Profile → Business Center → Become a Sponsor to create geo-targeted campaigns.' },
  ];

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Help & Support" onBack={onBack} />
      <div className="px-4 mt-4 max-w-[600px] mx-auto w-full space-y-5">
        <section className="p-4 rounded-card glass-strong flex items-center gap-3">
          <LifeBuoy size={22} className="text-vred" />
          <div>
            <div className="text-sm font-black text-white">We're here to help</div>
            <div className="text-[11px] text-vmuted">Typical reply within 24 hours.</div>
          </div>
        </section>

        <section className="rounded-card glass overflow-hidden divide-y divide-white/5">
          <a href="mailto:support@vallavan.in" className="flex items-center gap-3 px-4 py-3.5">
            <Mail size={18} className="text-vgold" />
            <div className="flex-1"><div className="text-sm font-semibold text-white">Email</div><div className="text-[11px] text-vmuted">support@vallavan.in</div></div>
          </a>
          <a href="tel:+914400000000" className="flex items-center gap-3 px-4 py-3.5">
            <Phone size={18} className="text-vgold" />
            <div className="flex-1"><div className="text-sm font-semibold text-white">Phone</div><div className="text-[11px] text-vmuted">+91 44 0000 0000</div></div>
          </a>
          <a href="https://wa.me/919000000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3.5">
            <MessageCircle size={18} className="text-vgold" />
            <div className="flex-1"><div className="text-sm font-semibold text-white">WhatsApp</div><div className="text-[11px] text-vmuted">Chat with support</div></div>
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
