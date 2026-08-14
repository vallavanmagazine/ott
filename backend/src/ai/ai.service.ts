import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { SettingsService } from '../common/settings.service';

export interface AdCreativeResult {
  headline: string;
  body: string;
  cta: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** System prompt for the Vallavan AI support assistant. No phone/WhatsApp ever. */
export const VALLAVAN_SYSTEM_PROMPT = `You are Vallavan AI Assistant. You help sponsors understand advertising options, help freelancers with task questions, and answer general viewer questions about the platform.

Pricing: Display ads ₹99-799/day. Inspire video ₹9,999 or ₹25,000. Freelancer enrollment: ₹1,499.

Never share phone numbers or WhatsApp numbers. Direct users to download the Vallavan app for dashboards. For escalated issues, say: Our team will contact you via email at support@vallavan.in.

Be concise, warm, and practical. Answer in the user's language (Tamil or English).`;

/**
 * AI Studio ad-creative generation via Anthropic. The API key lives server-side
 * only (SettingsService → platform_settings / env). Uses the latest Claude model.
 */
@Injectable()
export class AiService {
  constructor(private readonly settings: SettingsService) {}

  async adCreative(product: string, language = 'Bilingual', tone = 'energetic'): Promise<AdCreativeResult> {
    const apiKey = await this.settings.require('ANTHROPIC_API_KEY');
    const client = new Anthropic({ apiKey });

    const prompt = `You write short ad creatives for a Tamil-first OTT ad platform.
Product/brief: "${product}"
Language: ${language} (mix Tamil + English naturally when Bilingual).
Tone: ${tone}.
Return STRICT JSON only: {"headline": "...", "body": "...", "cta": "..."}.
headline <= 8 words, body <= 20 words, cta <= 3 words.`;

    const msg = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = msg.content.map((b) => ('text' in b ? b.text : '')).join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { headline: text.slice(0, 60), body: '', cta: 'Learn More' };
    const parsed = JSON.parse(match[0]);
    return {
      headline: parsed.headline ?? '',
      body: parsed.body ?? '',
      cta: parsed.cta ?? 'Learn More',
    };
  }

  /**
   * Conversational support assistant. Takes the running chat history and
   * returns the assistant's next reply. Uses the Vallavan system prompt.
   */
  async chat(messages: ChatMessage[]): Promise<{ reply: string }> {
    const apiKey = await this.settings.require('ANTHROPIC_API_KEY');
    const client = new Anthropic({ apiKey });

    const history = (messages ?? [])
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .slice(-16)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content }));

    if (history.length === 0) return { reply: 'Hi! I\'m the Vallavan AI Assistant. Ask me about advertising, freelancing, or using the app.' };

    const msg = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 600,
      system: VALLAVAN_SYSTEM_PROMPT,
      messages: history,
    });

    const reply = msg.content.map((b) => ('text' in b ? b.text : '')).join('').trim();
    return { reply: reply || 'Sorry, I could not generate a reply. Please try again, or email support@vallavan.in.' };
  }
}
