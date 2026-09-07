/**
 * Platform settings (API keys / integration config).
 * SECURITY: values are write-only from the client. Secret values are never
 * read back into the browser — `platform_settings` has no client SELECT policy.
 * The admin UI learns which keys are configured via configured_setting_keys()
 * (names only). Actual values are consumed server-side by NestJS (service role).
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export const SETTING_KEYS = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'FAST2SMS_API_KEY',
  'DYNETUBE_API_KEY',
  'WHATSAPP_API_KEY',
  'FIREBASE_SERVER_KEY',
  'FIREBASE_PROJECT_ID',
  'OPENWEATHER_API_KEY',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Names of keys that currently have a non-empty value (never the values). */
export async function fetchConfiguredKeys(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('configured_setting_keys');
  if (error || !data) return [];
  return data as string[];
}

/**
 * Save a secret value (admin only). Writes via the SECURITY DEFINER RPC
 * `set_platform_setting`, which runs is_admin() server-side and upserts as the
 * table owner — so the write succeeds whenever the admin's session is valid and
 * never depends on the exact table RLS policy shape (which previously caused
 * "new row violates row-level security policy" on upsert). See
 * supabase/fix_platform_settings.sql.
 */
export async function saveSetting(key: SettingKey, value: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');

  // Guard: make sure the admin session token is actually attached to this
  // request. Without it the RPC runs as `anon`, is_admin() is false, and the
  // user would see a confusing RLS error instead of "please sign in again".
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('Your admin session has expired. Please sign in again and retry.');
  }

  const { error } = await supabase.rpc('set_platform_setting', { p_key: key, p_value: value });
  if (error) {
    if (/admin access required/i.test(error.message)) {
      throw new Error('This account is not an admin (or its session expired). Sign in with an admin account and retry.');
    }
    if (/could not find the function|set_platform_setting/i.test(error.message)) {
      throw new Error('Settings RPC missing — run supabase/fix_platform_settings.sql in Supabase, then retry.');
    }
    throw error;
  }
  await logAudit(`Updated API setting ${key}`);
}
