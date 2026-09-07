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
    const channel = await this.sendOtpSms(phone, code);
    // channel: 'sms' when Fast2SMS delivered, 'skipped' when key not configured
    return { sent: true, channel };
  }

  /**
   * Send an OTP via the Fast2SMS "otp" route (POST /dev/bulkV2, body
   * { route: 'otp', variables_values, numbers }). The OTP route is Fast2SMS's
   * built-in "Your OTP is {code}" sender — it does NOT use a DLT template, but
   * it must be enabled on the account and requires wallet balance. If your
   * account is DLT-only you'd instead need route:'dlt' with sender_id +
   * approved message template id.
   *
   * On any non-success we surface the FULL Fast2SMS response body — that body
   * carries the real reason (invalid key, insufficient balance, route not
   * enabled, spam/DLT block, bad number), not the bare HTTP status.
   */
  private async sendOtpSms(phone: string, code: string): Promise<'sms' | 'skipped'> {
    const key = await this.settings.get('FAST2SMS_API_KEY');
    if (!key) { this.log.warn(`[skip] FAST2SMS_API_KEY not set — would OTP ${phone}: ${code}`); return 'skipped'; }
    const numbers = phone.replace(/\D/g, '').slice(-10);
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'otp', variables_values: code, numbers }),
    });

    const bodyText = await res.text();
    let parsed: any; try { parsed = JSON.parse(bodyText); } catch { /* non-JSON body */ }
    const failed = !res.ok || parsed?.return === false;
    if (failed) {
      // Full body so the real cause is visible in logs (route=otp helps triage).
      this.log.error(`Fast2SMS OTP send FAILED (route=otp, http=${res.status}) to …${numbers.slice(-4)}: ${bodyText}`);
      const reason = parsed?.message
        ? (Array.isArray(parsed.message) ? parsed.message.join('; ') : String(parsed.message))
        : bodyText;
      throw new Error(`Fast2SMS OTP failed (${res.status}): ${reason}`);
    }
    this.log.log(`Fast2SMS OTP sent (route=otp) to …${numbers.slice(-4)}`);
    return 'sms';
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

  /** Generic transactional SMS via the Fast2SMS "q" (Quick) route. Surfaces the
   *  full response body on failure, same as the OTP path. */
  async sendSms(phone: string, message: string) {
    const key = await this.settings.get('FAST2SMS_API_KEY');
    if (!key) { this.log.warn(`[skip] FAST2SMS_API_KEY not set — would SMS ${phone}: ${message}`); return { skipped: true }; }
    const numbers = phone.replace(/\D/g, '').slice(-10);
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'q', message, numbers }),
    });
    const bodyText = await res.text();
    let parsed: any; try { parsed = JSON.parse(bodyText); } catch { /* non-JSON body */ }
    if (!res.ok || parsed?.return === false) {
      this.log.error(`Fast2SMS SMS send FAILED (route=q, http=${res.status}) to …${numbers.slice(-4)}: ${bodyText}`);
      const reason = parsed?.message
        ? (Array.isArray(parsed.message) ? parsed.message.join('; ') : String(parsed.message))
        : bodyText;
      throw new Error(`Fast2SMS SMS failed (${res.status}): ${reason}`);
    }
    return parsed ?? { raw: bodyText };
  }
}
