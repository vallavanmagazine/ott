import { Injectable, Logger } from '@nestjs/common';

/**
 * Meta Graph API (Facebook Page + Instagram Business) — STUB ONLY.
 * No live calls are made. Real publishing is blocked until Vallavan's Meta
 * business accounts are verified for publishing permissions (setup dependency,
 * BLOCKERS B5) and explicit approval is given.
 */
@Injectable()
export class SocialService {
  private readonly log = new Logger('SocialService');

  async publish(input: { channel: 'facebook' | 'instagram'; headline: string; imageUrl?: string }) {
    this.log.warn(`[STUB] Would publish to ${input.channel}: "${input.headline}"${input.imageUrl ? ` (${input.imageUrl})` : ''}`);
    return { success: false, reason: 'Meta account not configured (stub — no live API calls).' };
  }
}
