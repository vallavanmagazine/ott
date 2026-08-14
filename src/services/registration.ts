/**
 * Account registration (sponsor + freelancer). OTP-gated, passwordless.
 *
 * Design: account creation uses Supabase email OTP (built-in, no external key).
 * When the NestJS backend + Fast2SMS are configured, we additionally verify the
 * user's MOBILE via Fast2SMS before creating the account. When Fast2SMS is not
 * configured we fall back to email OTP only (logged in PROJECT_STATE.md).
 *
 * On success: a Supabase Auth user exists, plus an app_users row (role) and a
 * sponsors/freelancers row linked to the auth user id.
 */
import { supabase } from '@/lib/supabase';
import { sendOtp as sendPhoneOtpBackend, verifyOtp as verifyPhoneOtpBackend } from '@/services/kyc';
import { hasBackend } from '@/lib/api';

export type RegisterRole = 'sponsor' | 'freelancer';

export interface RegisterInput {
  role: RegisterRole;
  name: string;
  phone: string;
  email: string;
  district: string;
}

/** True when phone OTP (Fast2SMS) is available; else email OTP is the only step. */
export const phoneOtpAvailable = () => hasBackend();

/** Step 1 (optional): send a mobile OTP via Fast2SMS. */
export async function sendMobileOtp(phone: string) {
  return sendPhoneOtpBackend(phone);
}

/** Step 1 verify (optional): confirm the mobile OTP. */
export async function verifyMobileOtp(phone: string, code: string) {
  return verifyPhoneOtpBackend(phone, code);
}

/** Step 2: send the email OTP that creates the account (Supabase built-in). */
export async function sendEmailOtp(input: RegisterInput) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: { shouldCreateUser: true, data: { name: input.name, phone: input.phone, role: input.role, district: input.district } },
  });
  if (error) throw error;
  return { sent: true };
}

/**
 * Step 2 verify: confirm the email OTP → session established → create profile
 * rows. Returns the new auth user id.
 */
export async function verifyEmailOtpAndCreateProfile(input: RegisterInput, token: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.verifyOtp({ email: input.email, token, type: 'email' });
  if (error || !data.user) throw new Error(error?.message ?? 'Invalid or expired code.');
  const userId = data.user.id;

  // app_users (idempotent by email)
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

  return userId;
}
