/**
 * Razorpay Payment Links (Section B3). Links are generated server-side (NestJS
 * holds the secret key); the client only requests + reads them. TEST MODE ONLY.
 */
import { apiPost, hasBackend } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';

export interface PaymentLink {
  id: string;
  shortUrl: string;
  amountRupees: number;
  status: string;
  purpose: string;
  date: string;
}

/** Ask the backend to create a Razorpay payment link (test mode). */
export async function createPaymentLink(input: {
  sponsorId: string; amountRupees: number; purpose?: string; name?: string; email?: string; contact?: string;
}): Promise<{ id: string; shortUrl: string }> {
  if (!hasBackend()) throw new Error('Payment backend not configured (set VITE_API_BASE_URL).');
  return apiPost('/api/payments/create-link', input);
}

export async function fetchPaymentLinks(sponsorId: string): Promise<PaymentLink[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('payment_links').select('*').eq('sponsor_id', sponsorId).order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id, shortUrl: r.razorpay_short_url ?? '', amountRupees: Math.round(r.amount_paise / 100),
    status: r.status, purpose: r.purpose, date: r.created_at ? formatDate(r.created_at) : '—',
  }));
}

/** WhatsApp/SMS/email share deep-links for a payment URL. */
export function shareLinks(url: string, amountRupees: number) {
  const msg = `Complete your Vallavan wallet top-up of ₹${amountRupees.toLocaleString('en-IN')}: ${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
    sms: `sms:?body=${encodeURIComponent(msg)}`,
    email: `mailto:?subject=${encodeURIComponent('Vallavan Wallet Top-up')}&body=${encodeURIComponent(msg)}`,
  };
}
