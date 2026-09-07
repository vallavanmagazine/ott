/**
 * Phone + OTP auth for sponsor/freelancer accounts (NO Supabase Auth).
 *
 * OTP is sent via Fast2SMS directly from the client (DEV-MODE — the key is read
 * from VITE_FAST2SMS_KEY and is exposed in the bundle; route through NestJS for
 * production). When no key is configured we use a test OTP (123456) so the flow
 * is usable in development. Codes are stored hashed in otp_verifications.
 *
 * Accounts are inserted directly into app_users + sponsors/freelancers with
 * client-generated UUIDs. The session lives in localStorage (see session.ts).
 * Supabase Auth is used ONLY for admin login.
 */
import { supabase } from '@/lib/supabase';
import { apiPost, hasBackend } from '@/lib/api';
import { saveSession, type PhoneSession } from '@/services/session';

const FAST2SMS_KEY = (import.meta.env.VITE_FAST2SMS_KEY as string | undefined)?.trim() || '';
const RESEND_KEY = (import.meta.env.VITE_RESEND_KEY as string | undefined)?.trim() || '';
const TEST_OTP = '123456';
const OTP_TTL_MS = 5 * 60 * 1000;

export const fast2smsConfigured = () => FAST2SMS_KEY.length > 0;

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; const v = c === 'x' ? r : (r & 0x3) | 0x8; return v.toString(16);
  });
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

const normPhone = (p: string) => p.replace(/\D/g, '').slice(-10);

export interface SendOtpResult { ok: boolean; testMode: boolean; testCode?: string; error?: string; }

/**
 * Send an OTP. When the backend is configured we route through it (NestJS holds
 * the Fast2SMS key and avoids browser CORS) — this is the path that actually
 * delivers SMS from the web. Otherwise we fall back to a client-side path: a
 * direct Fast2SMS call if VITE_FAST2SMS_KEY is set, else a test OTP (123456).
 */
export async function sendOTP(phone: string, purpose = 'register'): Promise<SendOtpResult> {
  if (!supabase) return { ok: false, testMode: false, error: 'Service not configured.' };
  const numbers = normPhone(phone);
  if (numbers.length < 10) return { ok: false, testMode: false, error: 'Please enter a valid 10-digit mobile number.' };

  // Preferred: backend delivers the SMS and stores the code (service role).
  if (hasBackend()) {
    try {
      const res = await apiPost<{ sent?: boolean; channel?: string }>('/api/otp/send', { phone: numbers });
      if (res?.channel === 'skipped') {
        return { ok: false, testMode: false, error: 'SMS service is not configured on the server yet. Add FAST2SMS_API_KEY in Admin → API Settings.' };
      }
      return { ok: res?.sent !== false, testMode: false };
    } catch (e) {
      return { ok: false, testMode: false, error: (e as Error).message };
    }
  }

  // Client-side fallback (dev only): store the code and try Fast2SMS directly.
  const testMode = !fast2smsConfigured();
  const code = testMode ? TEST_OTP : String(Math.floor(100000 + Math.random() * 900000));
  try {
    const code_hash = await sha256Hex(code);
    await supabase.from('otp_verifications').insert({
      phone: numbers, code_hash, purpose, expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(), consumed: false,
    });
  } catch (e) {
    return { ok: false, testMode, error: (e as Error).message };
  }
  if (!testMode) {
    try {
      await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: { authorization: FAST2SMS_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ route: 'otp', variables_values: code, numbers }),
      });
    } catch { /* browser CORS may block this; prefer the backend path in production */ }
    return { ok: true, testMode: false };
  }
  return { ok: true, testMode: true, testCode: code };
}

/** Verify an OTP. Uses the backend when configured; else checks the table directly. */
export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const numbers = normPhone(phone);
  if (hasBackend()) {
    try {
      const res = await apiPost<{ ok: boolean }>('/api/otp/verify', { phone: numbers, code: code.trim() });
      return res.ok === true;
    } catch {
      return false;
    }
  }
  if (!supabase) return false;
  try {
    const { data } = await supabase
      .from('otp_verifications')
      .select('id, code_hash, expires_at, consumed')
      .eq('phone', numbers).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!data || data.consumed) return false;
    if (new Date(data.expires_at).getTime() < Date.now()) return false;
    if (data.code_hash !== (await sha256Hex(code.trim()))) return false;
    await supabase.from('otp_verifications').update({ consumed: true }).eq('id', data.id);
    return true;
  } catch {
    return false;
  }
}

/**
 * Send an EMAIL OTP. Prefers the backend (Resend via /api/otp/send-email);
 * falls back to a dev test code (browsers can't send Resend email directly).
 */
export async function sendEmailOTP(email: string, purpose = 'email_verify'): Promise<SendOtpResult> {
  if (!supabase) return { ok: false, testMode: false, error: 'Service not configured.' };
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { ok: false, testMode: false, error: 'Please enter a valid email address.' };

  if (hasBackend()) {
    try {
      const res = await apiPost<{ sent?: boolean; channel?: string }>('/api/otp/send-email', { email: e });
      if (res?.channel === 'skipped') {
        return { ok: false, testMode: false, error: 'Email service is not configured on the server yet. Add RESEND_API_KEY in Admin → API Settings.' };
      }
      return { ok: res?.sent !== false, testMode: false };
    } catch (err) {
      return { ok: false, testMode: false, error: (err as Error).message };
    }
  }

  // Client-side fallback (dev only): store the code; email can't be sent from
  // the browser, so we surface a test code.
  const code = TEST_OTP;
  try {
    const code_hash = await sha256Hex(code);
    await supabase.from('otp_verifications').insert({
      email: e, code_hash, purpose, expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(), consumed: false,
    });
  } catch (err) {
    return { ok: false, testMode: true, error: (err as Error).message };
  }
  return { ok: true, testMode: true, testCode: code };
}

/** Verify an EMAIL OTP. Backend when configured; else checks the table directly. */
export async function verifyEmailOTP(email: string, code: string): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (hasBackend()) {
    try {
      const res = await apiPost<{ ok: boolean }>('/api/otp/verify-email', { email: e, code: code.trim() });
      return res.ok === true;
    } catch {
      return false;
    }
  }
  if (!supabase) return false;
  try {
    const { data } = await supabase
      .from('otp_verifications')
      .select('id, code_hash, expires_at, consumed')
      .eq('email', e).eq('purpose', 'email_verify')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (!data || data.consumed) return false;
    if (new Date(data.expires_at).getTime() < Date.now()) return false;
    if (data.code_hash !== (await sha256Hex(code.trim()))) return false;
    await supabase.from('otp_verifications').update({ consumed: true }).eq('id', data.id);
    return true;
  } catch {
    return false;
  }
}

export interface AccountInput { name: string; phone: string; email: string; district: string; roles?: string[]; }

export async function createSponsorAccount(input: AccountInput): Promise<PhoneSession> {
  if (!supabase) throw new Error('Service not configured.');
  const userId = uuid();
  const sponsorId = uuid();
  const phone = normPhone(input.phone);
  const { error: uErr } = await supabase.from('app_users').insert({ id: userId, email: input.email, name: input.name, phone, role: 'Sponsor', status: 'Active' });
  if (uErr) throw describeInsertError('app_users', uErr);
  const { error: sErr } = await supabase.from('sponsors').insert({ id: sponsorId, name: input.name, owner_name: input.name, email: input.email, phone, district: input.district, owner_id: userId, status: 'Pending' });
  if (sErr) throw describeInsertError('sponsors', sErr);

  const session: PhoneSession = { userId, name: input.name, phone, email: input.email, role: 'Sponsor', sponsorId };
  saveSession(session);
  void sendWelcome(input.email, input.name, 'sponsor');
  return session;
}

export async function createFreelancerAccount(input: AccountInput): Promise<PhoneSession> {
  if (!supabase) throw new Error('Service not configured.');
  const userId = uuid();
  const freelancerId = uuid();
  const phone = normPhone(input.phone);
  const { error: uErr } = await supabase.from('app_users').insert({ id: userId, email: input.email, name: input.name, phone, role: 'Freelancer', status: 'Active' });
  if (uErr) throw describeInsertError('app_users', uErr);
  const { error: fErr } = await supabase.from('freelancers').insert({ id: freelancerId, user_id: userId, name: input.name, email: input.email, phone, district: input.district, roles: input.roles ?? [], status: 'pending' });
  if (fErr) throw describeInsertError('freelancers', fErr);

  const session: PhoneSession = { userId, name: input.name, phone, email: input.email, role: 'Freelancer', freelancerId };
  saveSession(session);
  void sendWelcome(input.email, input.name, 'freelancer');
  return session;
}

/** Returning-user login: look up app_users by phone (after OTP verify). */
export async function loginLookup(phone: string): Promise<PhoneSession | null> {
  if (!supabase) return null;
  const numbers = normPhone(phone);
  const { data, error } = await supabase.rpc('find_user_by_phone', { p: numbers });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const session: PhoneSession = {
    userId: row.id, name: row.name ?? '', phone: row.phone ?? numbers, email: row.email ?? '',
    role: (String(row.role).toLowerCase() === 'sponsor' ? 'Sponsor' : 'Freelancer'),
    sponsorId: row.sponsor_id ?? undefined, freelancerId: row.freelancer_id ?? undefined,
  };
  saveSession(session);
  return session;
}

/**
 * Build an Error from a Supabase insert failure WITHOUT hiding the real cause.
 * The full PostgrestError (message/details/hint/code) is logged to the console
 * and its text is appended to the surfaced message, so a partially-applied
 * migration (missing column), a NOT NULL/FK violation, or an RLS block is
 * visible instead of a blank "please try again".
 */
function describeInsertError(context: string, err: any): Error {
  // eslint-disable-next-line no-console
  console.error(`[register] ${context} insert failed:`, err);
  const raw = [err?.message, err?.details, err?.hint].filter(Boolean).join(' — ') || 'unknown error';
  if (/duplicate|already exists|unique/i.test(raw)) return new Error('An account with this phone or email already exists. Please log in instead.');
  if (/row-level security|permission|policy|rls/i.test(raw)) return new Error(`Blocked by database policy — apply supabase/fix_phone_auth.sql. (${raw})`);
  if (/schema cache|column .* does not exist|could not find the/i.test(raw)) return new Error(`Database is missing a column for ${context} — apply the latest supabase/*.sql. (${raw})`);
  if (/null value|not-null/i.test(raw)) return new Error(`A required ${context} field was empty. (${raw})`);
  if (/foreign key/i.test(raw)) return new Error(`Could not link the ${context} record. (${raw})`);
  return new Error(`Could not create the account (${context}): ${raw}`);
}

/** Best-effort welcome email via the backend (Resend), or direct if a key is set. */
async function sendWelcome(email: string, name: string, role = 'member') {
  if (hasBackend()) { try { await apiPost('/api/notify/welcome', { email, name, role }); return; } catch { /* fall through */ } }
  if (RESEND_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Vallavan <noreply@vallavan.in>', to: email, subject: 'Welcome to Vallavan', html: `<p>Vanakkam ${name},</p><p>Welcome to Vallavan — documentaries that matter.</p>` }),
      });
    } catch { /* ignore */ }
  }
}
