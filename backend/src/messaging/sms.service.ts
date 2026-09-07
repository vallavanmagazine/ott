import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { SettingsService } from '../common/settings.service';
import { SupabaseService } from '../common/supabase.service';
import { EmailService } from './email.service';

const OTP_TTL_MS = 15 * 60 * 1000; // 15 minutes (matches the SMS/email copy)

/**
 * OTP + SMS via Fast2SMS, and email OTP via Resend. OTP codes are hashed at
 * rest in otp_verifications (phone rows use `phone`, email rows use `email`).
 */
@Injectable()
export class SmsService {
  private log = new Logger('SmsService');
  constructor(
    private readonly settings: SettingsService,
    private readonly supa: SupabaseService,
    private readonly email: EmailService,
  ) {}

  private hash(code: string) { return crypto.createHash('sha256').update(code).digest('hex'); }
  private genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

  // ===========================================================================
  // PHONE OTP
  // ===========================================================================
  async sendOtp(phone: string, purpose = 'sponsor_login') {
    const code = this.genCode();
    const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();
    await this.supa.client.from('otp_verifications').insert({ phone, code_hash: this.hash(code), purpose, expires_at: expires });
    const channel = await this.sendOtpSms(phone, code);
    // channel: 'sms' when Fast2SMS delivered, 'skipped' when key not configured
    return { sent: true, channel };
  }

  /**
   * Send an OTP via the Fast2SMS "Quick SMS" route — a GET to /dev/bulkV2 with
   * query params ?route=q&message=…&numbers=… and the API key in the
   * Authorization header. Quick SMS needs no DLT template and no account
   * website verification (₹5/SMS), unlike the "otp" route which requires
   * website verification this account doesn't have. The full response body is
   * logged on any failure so the real reason is visible.
   */
  private async sendOtpSms(phone: string, code: string): Promise<'sms' | 'skipped'> {
    const key = await this.settings.get('FAST2SMS_API_KEY');
    if (!key) { this.log.warn(`[skip] FAST2SMS_API_KEY not set — would OTP ${phone}: ${code}`); return 'skipped'; }
    const numbers = phone.replace(/\D/g, '').slice(-10);
    const message = `Your Vallavan OTP is ${code}. Valid for 15 minutes.`;
    await this.quickSms(numbers, message, 'OTP');
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

  // ===========================================================================
  // EMAIL OTP (mirrors phone OTP; stored on the `email` column)
  // ===========================================================================
  async sendEmailOtp(email: string, purpose = 'email_verify') {
    const code = this.genCode();
    const expires = new Date(Date.now() + OTP_TTL_MS).toISOString();
    await this.supa.client.from('otp_verifications').insert({ email, code_hash: this.hash(code), purpose, expires_at: expires });
    const res: any = await this.email.verificationCode(email, code);
    const channel = res?.skipped ? 'skipped' : 'email';
    return { sent: true, channel };
  }

  async verifyEmailOtp(email: string, code: string): Promise<boolean> {
    const { data } = await this.supa.client
      .from('otp_verifications')
      .select('id, code_hash, expires_at, consumed')
      .eq('email', email).eq('purpose', 'email_verify')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!data || data.consumed) return false;
    if (new Date(data.expires_at).getTime() < Date.now()) return false;
    if (data.code_hash !== this.hash(code)) return false;
    await this.supa.client.from('otp_verifications').update({ consumed: true }).eq('id', data.id);
    return true;
  }

  // ===========================================================================
  // Generic transactional SMS (also Quick SMS / route=q)
  // ===========================================================================
  async sendSms(phone: string, message: string) {
    const key = await this.settings.get('FAST2SMS_API_KEY');
    if (!key) { this.log.warn(`[skip] FAST2SMS_API_KEY not set — would SMS ${phone}: ${message}`); return { skipped: true }; }
    const numbers = phone.replace(/\D/g, '').slice(-10);
    return this.quickSms(numbers, message, 'SMS');
  }

  /** Shared Fast2SMS Quick-SMS GET call with full-body error logging. */
  private async quickSms(numbers: string, message: string, label: string): Promise<any> {
    const key = await this.settings.require('FAST2SMS_API_KEY');
    const url = new URL('https://www.fast2sms.com/dev/bulkV2');
    url.searchParams.set('route', 'q');
    url.searchParams.set('message', message);
    url.searchParams.set('numbers', numbers);
    const res = await fetch(url.toString(), { method: 'GET', headers: { authorization: key } });

    const bodyText = await res.text();
    let parsed: any; try { parsed = JSON.parse(bodyText); } catch { /* non-JSON body */ }
    if (!res.ok || parsed?.return === false) {
      this.log.error(`Fast2SMS ${label} send FAILED (route=q, http=${res.status}) to …${numbers.slice(-4)}: ${bodyText}`);
      const reason = parsed?.message
        ? (Array.isArray(parsed.message) ? parsed.message.join('; ') : String(parsed.message))
        : bodyText;
      throw new Error(`Fast2SMS ${label} failed (${res.status}): ${reason}`);
    }
    this.log.log(`Fast2SMS ${label} sent (route=q) to …${numbers.slice(-4)}`);
    return parsed ?? { raw: bodyText };
  }
}
