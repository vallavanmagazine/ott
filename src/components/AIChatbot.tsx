import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Bot, Volume2, VolumeX } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { sendChat, SUPPORT_EMAIL, type ChatMessage } from '@/services/chat';

// Minimal typing for the Web Speech API (not in the TS DOM lib by default).
type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: (e: any) => void; onerror: () => void; onend: () => void;
  start: () => void; stop: () => void;
};

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as any;
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const GREETING: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm the Vallavan AI Assistant 🤖 — I can help with advertising options, freelancer questions, or using the app. How can I help?",
};

export function AIChatbot({ onBack, title = 'AI Assistant' }: { onBack: () => void; title?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voiceSupported = typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, busy]);

  const speakText = (text: string) => {
    if (!speak || !ttsSupported) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(next);
    setInput('');
    setBusy(true);
    const reply = await sendChat(next);
    setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    setBusy(false);
    speakText(reply);
  };

  const toggleMic = () => {
    if (listening) { recRef.current?.stop(); return; }
    const rec = getRecognition();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = 'en-IN'; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: any) => { const t = e.results?.[0]?.[0]?.transcript ?? ''; if (t) send(t); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  };

  return (
    <div className="min-h-screen bg-vblack flex flex-col">
      <SubPageHeader title={title} onBack={onBack} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-2 max-w-[720px] mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 mb-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-vred/20 flex items-center justify-center flex-shrink-0 mt-0.5"><Bot size={16} className="text-vred" /></div>}
            <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-vred text-white rounded-br-md' : 'glass text-white/90 rounded-bl-md'}`}>{m.content}</div>
          </div>
        ))}
        {busy && (
          <div className="flex gap-2 mb-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-vred/20 flex items-center justify-center flex-shrink-0"><Bot size={16} className="text-vred" /></div>
            <div className="glass px-4 py-3 rounded-2xl rounded-bl-md"><div className="flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-vmuted animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 rounded-full bg-vmuted animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 rounded-full bg-vmuted animate-bounce" style={{ animationDelay: '300ms' }} /></div></div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 text-center text-[10px] text-vmuted">Our AI assistant helps 24/7 · Email <span className="text-vgold">{SUPPORT_EMAIL}</span></div>

      <div className="border-t border-white/8 px-3 py-3 bg-vblack sticky bottom-0">
        <div className="max-w-[720px] mx-auto w-full flex items-center gap-2">
          {ttsSupported && (
            <button onClick={() => setSpeak((s) => !s)} title="Read answers aloud" className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${speak ? 'bg-vgold/20 text-vgold' : 'glass text-vmuted'}`}>
              {speak ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}
          {voiceSupported && (
            <button onClick={toggleMic} title="Voice input" className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${listening ? 'bg-vred text-white animate-pulse' : 'glass text-vmuted'}`}>
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
            placeholder="Ask anything…"
            className="flex-1 px-4 py-2.5 rounded-full glass text-sm text-white outline-none"
          />
          <button onClick={() => send(input)} disabled={busy || !input.trim()} className="w-10 h-10 rounded-full bg-vred text-white flex items-center justify-center flex-shrink-0 disabled:opacity-40">
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
