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

/** Upsert a secret value (admin only, enforced by RLS). */
export async function saveSetting(key: SettingKey, value: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
  await logAudit(`Updated API setting ${key}`);
}
