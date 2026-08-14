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

export type AssistantVariant = 'sponsor' | 'freelancer' | 'general';

const COMMON = `Never share phone numbers or WhatsApp numbers. For escalated issues, say: Our team will review and contact you via email at support@vallavan.in. Be concise, warm, and practical. Answer in the user's language (Tamil or English).`;

/** Role-specific system prompts for the in-dashboard AI assistants (FIX 2). */
export const SYSTEM_PROMPTS: Record<AssistantVariant, string> = {
  sponsor: `You are Vallavan Ad Assistant. You help sponsors create effective ads, plan campaigns, understand pricing (₹99-799/day display, ₹9,999/₹25,000 inspire), analyze campaign performance, and generate ad ideas for Tamil Nadu businesses. Be helpful, professional, and suggest creative ideas. You can draft ad headlines, body text, and CTA suggestions. ${COMMON}`,
  freelancer: `You are Vallavan Freelancer Assistant. You help freelancers with task assignments, content submission guidelines, payment/earnings queries, and recruitment questions. You act as an initial recruiter — ask preliminary questions about experience and skills. Roles include Reporter, Anchor, Writer, Visual Editor, Program Producer, Telecaller and Field Executive (ad sales, 20% commission). ${COMMON}`,
  general: `You are Vallavan AI Assistant. You answer general viewer questions about the platform (free ad-supported documentaries), advertising, and freelancing. Pricing: display ads ₹99-799/day; Inspire video ₹9,999 or ₹25,000; freelancer enrollment ₹1,499. Direct users to the app for dashboards. ${COMMON}`,
};

/** Back-compat export. */
export const VALLAVAN_SYSTEM_PROMPT = SYSTEM_PROMPTS.general;

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
  async chat(messages: ChatMessage[], variant: AssistantVariant = 'general'): Promise<{ reply: string }> {
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
      system: SYSTEM_PROMPTS[variant] ?? SYSTEM_PROMPTS.general,
      messages: history,
    });

    const reply = msg.content.map((b) => ('text' in b ? b.text : '')).join('').trim();
    return { reply: reply || 'Sorry, I could not generate a reply. Please try again, or email support@vallavan.in.' };
  }
}
