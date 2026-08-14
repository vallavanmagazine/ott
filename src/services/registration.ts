/**
 * Account registration (sponsor + freelancer). OTP-gated.
 *
 * Primary path (Fast2SMS configured on the backend): OTP is sent to the user's
 * MOBILE; after verify we create the Supabase Auth account with the email + an
 * auto-generated password, sign in, then create app_users + sponsors/freelancers.
 *
 * Fallback (Fast2SMS not configured): Supabase email OTP creates the account.
 *
 * All errors are mapped to friendly messages — no raw errors reach the user.
 */
import { supabase } from '@/lib/supabase';
import { sendOtp as sendPhoneOtpBackend, verifyOtp as verifyPhoneOtpBackend } from '@/services/kyc';
import { apiPost, hasBackend } from '@/lib/api';

export type RegisterRole = 'sponsor' | 'freelancer';
export type OtpChannel = 'sms' | 'email';

export interface RegisterInput {
  role: RegisterRole;
  name: string;
  phone: string;
  email: string;
  district: string;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function autoPassword(): string {
  // Strong random password the user never sees (mobile-OTP is the real gate).
  const rnd = crypto.getRandomValues(new Uint8Array(18));
  return 'Vlv#' + Array.from(rnd).map((b) => b.toString(36)).join('').slice(0, 20) + 'A9';
}

function friendly(e: unknown): string {
  const m = (e as Error)?.message ?? '';
  if (/already registered|already exists|duplicate/i.test(m)) return 'An account with this email already exists. Please log in instead.';
  if (/valid email|invalid.*email|unable to validate email/i.test(m)) return 'Please enter a valid email address.';
  if (/rate|too many/i.test(m)) return 'Too many attempts. Please wait a minute and try again.';
  if (/otp|token|expired|invalid/i.test(m)) return 'That code is incorrect or expired. Please try again.';
  if (/network|fetch|failed to/i.test(m)) return 'Network problem — please check your connection and retry.';
  return 'Something went wrong. Please try again.';
}

/** Step 1: begin registration. Sends OTP to mobile (SMS) or email. */
export async function startRegistration(input: RegisterInput): Promise<{ ok: boolean; channel?: OtpChannel; error?: string }> {
  if (!isValidEmail(input.email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (input.phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Please enter a valid 10-digit mobile number.' };
  try {
    if (hasBackend()) {
      const res = await sendPhoneOtpBackend(input.phone) as { channel?: string };
      // Backend replies channel:'sms' when Fast2SMS delivered, 'skipped' otherwise.
      if (res?.channel === 'sms') return { ok: true, channel: 'sms' };
      // Fast2SMS not configured on the backend → email OTP fallback.
    }
    await sendEmailOtp(input);
    return { ok: true, channel: 'email' };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

async function sendEmailOtp(input: RegisterInput) {
  if (!supabase) throw new Error('Auth is not configured.');
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: { shouldCreateUser: true, data: { name: input.name, phone: input.phone, role: input.role, district: input.district } },
  });
  if (error) throw error;
}

/** Step 2: verify the OTP and create the account + profile rows. */
export async function completeRegistration(input: RegisterInput, code: string, channel: OtpChannel): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Auth is not configured.' };
  try {
    if (channel === 'sms') {
      const ok = await verifyPhoneOtpBackend(input.phone, code);
      if (!ok) return { ok: false, error: 'That code is incorrect or expired. Please try again.' };
      const password = autoPassword();
      const { error: signUpErr } = await supabase.auth.signUp({
        email: input.email, password,
        options: { data: { name: input.name, phone: input.phone, role: input.role, district: input.district } },
      });
      if (signUpErr && !/already/i.test(signUpErr.message)) throw signUpErr;
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: input.email, password });
      if (signInErr) {
        // Account exists but this generated password won't match a prior one.
        return { ok: false, error: 'This email is already registered. Please log in instead.' };
      }
    } else {
      const { error } = await supabase.auth.verifyOtp({ email: input.email, token: code.trim(), type: 'email' });
      if (error) throw error;
    }

    await createProfileRows(input);
    void sendWelcome(input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

async function createProfileRows(input: RegisterInput) {
  if (!supabase) return;
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) throw new Error('No session after verification.');

  await supabase.from('app_users').upsert(
    { id: userId, email: input.email, name: input.name, phone: input.phone, role: input.role, status: 'active' },
    { onConflict: 'email' },
  );

  if (input.role === 'sponsor') {
    const existing = await supabase.from('sponsors').select('id').ilike('email', input.email).maybeSingle();
    const payload = { name: input.name, owner_name: input.name, email: input.email, phone: input.phone, district: input.district, owner_id: userId, status: 'Pending' };
    if (existing.data?.id) await supabase.from('sponsors').update(payload).eq('id', existing.data.id);
    else await supabase.from('sponsors').insert(payload);
  } else {
    const existing = await supabase.from('freelancers').select('id').ilike('email', input.email).maybeSingle();
    const payload = { user_id: userId, name: input.name, email: input.email, phone: input.phone, district: input.district, roles: [] as string[], status: 'pending' };
    if (existing.data?.id) await supabase.from('freelancers').update(payload).eq('id', existing.data.id);
    else await supabase.from('freelancers').insert(payload);
  }
}

/** Best-effort welcome email via Resend (backend). Never throws. */
async function sendWelcome(input: RegisterInput) {
  if (!hasBackend()) return;
  try { await apiPost('/api/notify/welcome', { email: input.email, name: input.name }); } catch { /* ignore */ }
}
