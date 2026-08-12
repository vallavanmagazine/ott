import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { SettingsService } from '../common/settings.service';

export interface AdCreativeResult {
  headline: string;
  body: string;
  cta: string;
}

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
}
