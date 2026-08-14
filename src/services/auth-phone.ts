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

/** Generate + store an OTP and (if configured) send it via Fast2SMS. */
export async function sendOTP(phone: string, purpose = 'register'): Promise<SendOtpResult> {
  if (!supabase) return { ok: false, testMode: false, error: 'Service not configured.' };
  const numbers = normPhone(phone);
  if (numbers.length < 10) return { ok: false, testMode: false, error: 'Please enter a valid 10-digit mobile number.' };

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
    } catch { /* browser CORS may block reading the response; the OTP is stored regardless */ }
    return { ok: true, testMode: false };
  }
  return { ok: true, testMode: true, testCode: code };
}

/** Verify an OTP against the latest stored code for this phone. */
export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  if (!supabase) return false;
  const numbers = normPhone(phone);
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

export interface AccountInput { name: string; phone: string; email: string; district: string; roles?: string[]; }

export async function createSponsorAccount(input: AccountInput): Promise<PhoneSession> {
  if (!supabase) throw new Error('Service not configured.');
  const userId = uuid();
  const sponsorId = uuid();
  const phone = normPhone(input.phone);
  const { error: uErr } = await supabase.from('app_users').insert({ id: userId, email: input.email, name: input.name, phone, role: 'Sponsor', status: 'Active' });
  if (uErr) throw new Error(friendlyInsert(uErr.message));
  const { error: sErr } = await supabase.from('sponsors').insert({ id: sponsorId, name: input.name, owner_name: input.name, email: input.email, phone, district: input.district, owner_id: userId, status: 'Pending' });
  if (sErr) throw new Error(friendlyInsert(sErr.message));

  const session: PhoneSession = { userId, name: input.name, phone, email: input.email, role: 'Sponsor', sponsorId };
  saveSession(session);
  void sendWelcome(input.email, input.name);
  return session;
}

export async function createFreelancerAccount(input: AccountInput): Promise<PhoneSession> {
  if (!supabase) throw new Error('Service not configured.');
  const userId = uuid();
  const freelancerId = uuid();
  const phone = normPhone(input.phone);
  const { error: uErr } = await supabase.from('app_users').insert({ id: userId, email: input.email, name: input.name, phone, role: 'Freelancer', status: 'Active' });
  if (uErr) throw new Error(friendlyInsert(uErr.message));
  const { error: fErr } = await supabase.from('freelancers').insert({ id: freelancerId, user_id: userId, name: input.name, email: input.email, phone, district: input.district, roles: input.roles ?? [], status: 'pending' });
  if (fErr) throw new Error(friendlyInsert(fErr.message));

  const session: PhoneSession = { userId, name: input.name, phone, email: input.email, role: 'Freelancer', freelancerId };
  saveSession(session);
  void sendWelcome(input.email, input.name);
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

function friendlyInsert(m: string): string {
  if (/duplicate|already exists|unique/i.test(m)) return 'An account with this phone or email already exists. Please log in instead.';
  if (/permission|rls|policy/i.test(m)) return 'Could not create the account (database policy). Apply supabase/fix_phone_auth.sql.';
  return 'Could not create the account. Please try again.';
}

/** Best-effort welcome email via the backend (Resend), or direct if a key is set. */
async function sendWelcome(email: string, name: string) {
  if (hasBackend()) { try { await apiPost('/api/notify/welcome', { email, name }); return; } catch { /* fall through */ } }
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
