/**
 * AI Studio (Phase 19) — ad creative generation via the NestJS backend, which
 * holds the Anthropic key server-side. The key is NEVER in the client bundle.
 */
import { API_BASE, hasBackend, apiPost } from '@/lib/api';

export interface AdCreativeRequest {
  product: string;
  tone?: string;
  language?: 'Tamil' | 'English' | 'Bilingual';
}

export interface AdCreativeResult {
  headline: string;
  body: string;
  cta: string;
}

/**
 * Generate ad copy. Requires the backend (VITE_API_BASE_URL) to be running with
 * ANTHROPIC_API_KEY configured. Throws a clear error when unavailable so the UI
 * can explain the setup step.
 */
export async function generateAdCreative(req: AdCreativeRequest): Promise<AdCreativeResult> {
  if (!hasBackend()) {
    throw new Error('AI Studio needs the backend running (set VITE_API_BASE_URL and configure ANTHROPIC_API_KEY in API Settings).');
  }
  return apiPost<AdCreativeResult>(`${API_BASE ? '' : ''}/api/ai/ad-creative`, req);
}
