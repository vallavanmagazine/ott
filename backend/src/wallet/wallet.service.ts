import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { SupabaseService } from '../common/supabase.service';
import { SettingsService } from '../common/settings.service';

/**
 * Wallet operations. Razorpay is TEST MODE ONLY — no live charges. Wallet
 * credits/debits are server-authoritative and idempotent (unique kind+reference).
 */
@Injectable()
export class WalletService {
  constructor(private readonly supa: SupabaseService, private readonly settings: SettingsService) {}

  private async razorpay() {
    const key_id = await this.settings.require('RAZORPAY_KEY_ID');
    const key_secret = await this.settings.require('RAZORPAY_KEY_SECRET');
    if (!key_id.startsWith('rzp_test_')) {
      throw new BadRequestException('Refusing non-test Razorpay key — test mode only.');
    }
    return { instance: new Razorpay({ key_id, key_secret }), key_id, key_secret };
  }

  async createOrder(sponsorId: string, amountRupees: number) {
    const { instance, key_id } = await this.razorpay();
    const amount = Math.round(amountRupees * 100); // paise
    const order = await instance.orders.create({ amount, currency: 'INR', receipt: `w_${sponsorId}_${Date.now()}` });
    return { orderId: order.id, amount, currency: 'INR', razorpayKeyId: key_id };
  }

  async verify(payload: {
    sponsorId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amountRupees: number;
  }) {
    const { key_secret } = await this.razorpay();
    const expected = crypto
      .createHmac('sha256', key_secret)
      .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
      .digest('hex');
    if (expected !== payload.razorpay_signature) {
      throw new BadRequestException('Invalid Razorpay signature');
    }
    const paise = Math.round(payload.amountRupees * 100);
    await this.credit(payload.sponsorId, paise, 'topup', payload.razorpay_payment_id);
    return { ok: true, balancePaise: await this.balancePaise(payload.sponsorId) };
  }

  /** Idempotent credit/debit. amountPaise > 0 credits, < 0 debits. */
  private async credit(sponsorId: string, amountPaise: number, kind: string, reference: string) {
    const c = this.supa.client;
    // idempotency: skip if this reference already recorded for this kind
    const { data: existing } = await c.from('wallet_transactions')
      .select('id').eq('kind', kind).eq('reference', reference).maybeSingle();
    if (existing) return;

    await c.from('wallet_transactions').insert({ sponsor_id: sponsorId, amount_paise: amountPaise, kind, reference });
    const current = await this.balancePaise(sponsorId);
    await c.from('wallets').upsert(
      { sponsor_id: sponsorId, balance_paise: current + amountPaise, updated_at: new Date().toISOString() },
      { onConflict: 'sponsor_id' },
    );
  }

  async balancePaise(sponsorId: string): Promise<number> {
    const { data } = await this.supa.client.from('wallets').select('balance_paise').eq('sponsor_id', sponsorId).maybeSingle();
    return Number(data?.balance_paise ?? 0);
  }

  async transactions(sponsorId: string) {
    const { data } = await this.supa.client.from('wallet_transactions')
      .select('id, amount_paise, kind, reference, created_at')
      .eq('sponsor_id', sponsorId).order('created_at', { ascending: false }).limit(50);
    return data ?? [];
  }

  /**
   * Section B5 — daily campaign deduction. For each Active campaign, debit its
   * daily_rate_paise from the sponsor wallet. Idempotent per (campaign, day):
   * the reference is `daily_<campaignId>_<YYYY-MM-DD>`. Campaigns whose sponsor
   * has insufficient balance are auto-paused. Designed to be called once a day
   * by an external scheduler (cron) hitting POST /api/wallet/run-daily-deduction.
   */
  async runDailyDeduction(dateISO?: string) {
    const c = this.supa.client;
    const day = (dateISO ?? new Date().toISOString()).slice(0, 10);
    const { data: campaigns, error } = await c
      .from('campaigns')
      .select('id, name, sponsor_id, daily_rate_paise')
      .eq('status', 'Active');
    if (error) throw error;

    const result = { day, processed: 0, charged: 0, paused: [] as string[], skipped: 0 };
    for (const camp of campaigns ?? []) {
      const cost = Number(camp.daily_rate_paise ?? 9900);
      if (!camp.sponsor_id || cost <= 0) { result.skipped++; continue; }
      const reference = `daily_${camp.id}_${day}`;

      // idempotency: already charged today?
      const { data: existing } = await c.from('wallet_transactions')
        .select('id').eq('kind', 'daily_charge').eq('reference', reference).maybeSingle();
      if (existing) { result.skipped++; continue; }

      const balance = await this.balancePaise(camp.sponsor_id);
      if (balance < cost) {
        await c.from('campaigns').update({ status: 'Paused' }).eq('id', camp.id);
        result.paused.push(camp.name ?? camp.id);
        continue;
      }
      await this.credit(camp.sponsor_id, -cost, 'daily_charge', reference);
      result.processed++;
      result.charged += cost;
    }
    return result;
  }

  /**
   * Per-post deduction. cost = base + (districtCount-1)*perDistrict (paise),
   * from pricing_config. Idempotent by postId. Throws on insufficient balance.
   * TODO(pricing): confirm exact formula with Murugavel (BLOCKERS B1).
   */
  async deductForPost(sponsorId: string, postId: string, districtCount: number) {
    const { data: pc } = await this.supa.client.from('pricing_config').select('*').limit(1).maybeSingle();
    const base = Number(pc?.base_post_paise ?? 0);
    const per = Number(pc?.per_district_paise ?? 0);
    const cost = base + Math.max(0, districtCount - 1) * per;

    const balance = await this.balancePaise(sponsorId);
    if (balance < cost) throw new BadRequestException('Insufficient wallet balance');
    await this.credit(sponsorId, -cost, 'post_charge', postId);
    return { charged: cost, balancePaise: await this.balancePaise(sponsorId) };
  }
}
