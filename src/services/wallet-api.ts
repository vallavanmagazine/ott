/**
 * Wallet top-up client (Phase 5). Talks to the NestJS backend which creates and
 * verifies Razorpay TEST-mode orders and credits the wallet server-side.
 * Razorpay key_id (public) is delivered by the backend; the secret stays server-side.
 */
import { apiPost, hasBackend } from '@/lib/api';

export interface CreateOrderResult {
  orderId: string;
  amount: number;    // paise
  currency: string;
  razorpayKeyId: string;
}

export async function createTopUpOrder(sponsorId: string, amountRupees: number, token?: string): Promise<CreateOrderResult> {
  if (!hasBackend()) throw new Error('Wallet backend not configured (set VITE_API_BASE_URL).');
  return apiPost<CreateOrderResult>('/api/wallet/create-order', { sponsorId, amountRupees }, token);
}

export interface VerifyResult { ok: boolean; balancePaise: number; }

export async function verifyTopUp(payload: Record<string, unknown>, token?: string): Promise<VerifyResult> {
  return apiPost<VerifyResult>('/api/wallet/verify', payload, token);
}
