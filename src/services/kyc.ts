/**
 * Sponsor KYC + phone-OTP signup (Section B2). OTP is sent/verified by the
 * NestJS backend (Fast2SMS server-side); the sponsor business record is written
 * to Supabase after verification. No secrets in the client.
 */
import { apiPost, hasBackend } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export interface KycInput {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType?: string;
  district?: string;
  gstNumber?: string;
}

/** Send an OTP to the phone via Fast2SMS (backend). */
export async function sendOtp(phone: string): Promise<{ ok: boolean }> {
  if (!hasBackend()) throw new Error('OTP backend not configured (set VITE_API_BASE_URL, configure Fast2SMS key in API Settings).');
  return apiPost<{ ok: boolean }>('/api/otp/send', { phone });
}

/** Verify the OTP code (backend). Returns true on success. */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  if (!hasBackend()) throw new Error('OTP backend not configured.');
  const res = await apiPost<{ ok: boolean }>('/api/otp/verify', { phone, code });
  return res.ok === true;
}

/**
 * Create (or update) the sponsor business record after OTP verification.
 * Links to the current auth user when signed in. Idempotent by email.
 */
export async function registerSponsorKyc(input: KycInput) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: userRes } = await supabase.auth.getUser();
  const ownerId = userRes.user?.id ?? null;

  const existing = await supabase.from('sponsors').select('id').ilike('email', input.email).maybeSingle();

  const payload = {
    name: input.businessName,
    owner_name: input.ownerName,
    email: input.email,
    phone: input.phone,
    business_type: input.businessType ?? null,
    district: input.district ?? null,
    gst_number: input.gstNumber ?? null,
    owner_id: ownerId,
  };

  if (existing.data?.id) {
    const { error } = await supabase.from('sponsors').update(payload).eq('id', existing.data.id);
    if (error) throw error;
    await logAudit(`Sponsor KYC updated for "${input.businessName}"`);
    return existing.data.id as string;
  }

  const { data, error } = await supabase.from('sponsors').insert(payload).select('id').single();
  if (error) throw error;
  await logAudit(`Sponsor KYC registered "${input.businessName}"`);
  return data.id as string;
}
