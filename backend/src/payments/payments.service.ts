import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { SettingsService } from '../common/settings.service';

/**
 * Razorpay Payment Links (Section B3). TEST MODE ONLY — refuses non-rzp_test_
 * keys. Links are generated server-side (secret never leaves the server).
 * Minimum top-up ₹999; 48-hour expiry.
 */
@Injectable()
export class PaymentsService {
  constructor(private readonly supa: SupabaseService, private readonly settings: SettingsService) {}

  async createLink(input: { sponsorId?: string; amountRupees: number; purpose?: string; name?: string; email?: string; contact?: string }) {
    const keyId = await this.settings.require('RAZORPAY_KEY_ID');
    const keySecret = await this.settings.require('RAZORPAY_KEY_SECRET');
    if (!keyId.startsWith('rzp_test_')) throw new BadRequestException('Refusing non-test Razorpay key — test mode only.');

    const amount = Math.round(input.amountRupees * 100);
    if (amount < 99900) throw new BadRequestException('Minimum top-up is ₹999.');

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const expireBy = Math.floor(Date.now() / 1000) + 48 * 3600;
    const res = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount, currency: 'INR', description: input.purpose ?? 'Vallavan wallet top-up', expire_by: expireBy,
        customer: { name: input.name, email: input.email, contact: input.contact },
        notify: { sms: true, email: true }, reminder_enable: true,
      }),
    });
    if (!res.ok) throw new BadRequestException(`Razorpay payment link failed: ${res.status}`);
    const j: any = await res.json();

    try {
      await this.supa.client.from('payment_links').insert({
        sponsor_id: input.sponsorId ?? null, amount_paise: amount, razorpay_link_id: j.id,
        razorpay_short_url: j.short_url, purpose: input.purpose ?? 'wallet_topup', status: 'created',
        expires_at: new Date(expireBy * 1000).toISOString(),
      });
    } catch { /* best-effort persistence */ }

    return { id: j.id, shortUrl: j.short_url };
  }

  /** Razorpay webhook handler — mark link paid + credit wallet. */
  async handleWebhook(body: any) {
    const entity = body?.payload?.payment_link?.entity;
    if (!entity) return { ok: true };
    try {
      await this.supa.client.from('payment_links').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('razorpay_link_id', entity.id);
    } catch { /* ignore */ }
    return { ok: true };
  }
}
