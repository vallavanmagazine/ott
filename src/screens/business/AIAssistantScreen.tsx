import { useState } from 'react';
import { Send, Mic, Bot } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';

interface Msg {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
  lang?: 'ta' | 'en';
}

const initialMsgs: Msg[] = [
  {
    id: 0,
    text: "வணக்கம்! I'm your Vallavan AI Assistant. I can help you create campaigns, write ad copy, and plan targeting — in Tamil or English. How can I help?",
    sender: 'assistant',
  },
];

export function AIAssistantScreen({ onBack }: { onBack: () => void }) {
  const [lang, setLang] = useState<'tamil' | 'english'>('tamil');
  const [msgs, setMsgs] = useState<Msg[]>(initialMsgs);
  const [input, setInput] = useState('');

  const send = () => {
    if (input.trim().length < 1) return;
    const userMsg: Msg = { id: Date.now(), text: input, sender: 'user' };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setTimeout(() => {
      const reply: Msg = {
        id: Date.now() + 1,
        text: lang === 'tamil'
          ? 'சரி! உங்கள் கேம்பைனுக்கு நான் உதவுகிறேன். முதலில், எந்த பிராண்டுக்கு விளம்பரம் செய்ய விரும்புகிறீர்கள்?'
          : 'Great! I can help with your campaign. First, which brand would you like to advertise?',
        sender: 'assistant',
      };
      setMsgs((m) => [...m, reply]);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-vblack flex flex-col">
      <SubPageHeader
        title="AI Assistant"
        onBack={onBack}
        rightAction={
          <div className="flex gap-1 p-0.5 rounded-full glass">
            <button
              onClick={() => setLang('tamil')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${lang === 'tamil' ? 'bg-vred text-white' : 'text-vmuted'}`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => setLang('english')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${lang === 'english' ? 'bg-vred text-white' : 'text-vmuted'}`}
            >
              EN
            </button>
          </div>
        }
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3 pb-32 max-w-[700px] mx-auto w-full">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-vred text-white rounded-br-sm'
                  : 'glass text-white rounded-bl-sm'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot size={12} className="text-vgold" />
                  <span className="text-[9px] font-bold text-vgold uppercase tracking-wide">Vallavan AI</span>
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested prompts */}
      {msgs.length <= 2 && (
        <div className="px-4 sm:px-6 lg:px-8 pb-3 max-w-[700px] mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {['Create a campaign', 'Write ad copy', 'Suggest targeting', 'Budget tips'].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); }}
                className="px-3 py-1.5 rounded-full glass text-[11px] font-semibold text-vmuted active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 glass-strong border-t border-white/8 safe-bottom">
        <div className="flex items-center gap-2 max-w-[700px] mx-auto w-full">
          <button className="w-10 h-10 flex-shrink-0 rounded-full glass flex items-center justify-center active:scale-90 transition">
            <Mic size={18} className="text-vgold" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={lang === 'tamil' ? 'செய்தி இங்கே தட்டச்சு செய்யவும்...' : 'Type a message...'}
            className="flex-1 px-4 py-2.5 rounded-full glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred"
          />
          <button
            onClick={send}
            className="w-10 h-10 flex-shrink-0 rounded-full bg-vred flex items-center justify-center active:scale-90 transition shadow-glow"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
