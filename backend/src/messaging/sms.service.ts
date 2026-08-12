import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SettingsService } from '../common/settings.service';
import { SupabaseService } from '../common/supabase.service';

/** OTP + SMS via Fast2SMS (Phase 15/17). Codes hashed at rest in otp_verifications. */
@Injectable()
export class SmsService {
  private log = new Logger('SmsService');
  constructor(private readonly settings: SettingsService, private readonly supa: SupabaseService) {}

  private hash(code: string) { return crypto.createHash('sha256').update(code).digest('hex'); }

  async sendOtp(phone: string, purpose = 'sponsor_login') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await this.supa.client.from('otp_verifications').insert({ phone, code_hash: this.hash(code), purpose, expires_at: expires });
    await this.sendSms(phone, `Your Vallavan OTP is ${code}. Valid 5 minutes.`);
    return { sent: true };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const { data } = await this.supa.client
      .from('otp_verifications')
      .select('id, code_hash, expires_at, consumed')
      .eq('phone', phone).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!data || data.consumed) return false;
    if (new Date(data.expires_at).getTime() < Date.now()) return false;
    if (data.code_hash !== this.hash(code)) return false;
    await this.supa.client.from('otp_verifications').update({ consumed: true }).eq('id', data.id);
    return true;
  }

  async sendSms(phone: string, message: string) {
    const key = await this.settings.get('FAST2SMS_API_KEY');
    if (!key) { this.log.warn(`[skip] FAST2SMS_API_KEY not set — would SMS ${phone}: ${message}`); return { skipped: true }; }
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, numbers: phone.replace(/\D/g, '').slice(-10) }),
    });
    if (!res.ok) throw new Error(`Fast2SMS failed: ${res.status}`);
    return res.json();
  }
}
