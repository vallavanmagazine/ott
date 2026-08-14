/**
 * AI support chat client (FIX 4). Talks to the NestJS backend, which holds the
 * Anthropic key and the Vallavan system prompt. No phone/WhatsApp anywhere —
 * escalation is email only (support@vallavan.in).
 */
import { apiPost, hasBackend } from '@/lib/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const SUPPORT_EMAIL = 'support@vallavan.in';

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  if (!hasBackend()) {
    return `The AI assistant needs the backend running (set VITE_API_BASE_URL and configure ANTHROPIC_API_KEY in API Settings). Meanwhile, email us at ${SUPPORT_EMAIL} and our team will help.`;
  }
  try {
    const res = await apiPost<{ reply: string }>('/api/ai/chat', { messages });
    return res.reply;
  } catch {
    return `Sorry, I couldn't reach the assistant just now. Please email ${SUPPORT_EMAIL} and our team will contact you.`;
  }
}
