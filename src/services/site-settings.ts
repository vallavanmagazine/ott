/**
 * Public CMS configuration — site title, contact details, social URLs and the
 * long-form legal/about copy.
 *
 * These deliberately do NOT live in `platform_settings`: that table is
 * write-only from the browser (it holds API secrets, and has no SELECT policy),
 * so nothing stored there can ever be read back to render a page. Site config
 * must be publicly readable, so it gets its own table — see
 * supabase/admin_dashboard.sql.
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export const SITE_SETTING_KEYS = [
  'SITE_TITLE',
  'SITE_TAGLINE',
  'CONTACT_EMAIL',
  'CONTACT_PHONE',
  'LOGO_URL',
  'DEFAULT_LANGUAGE',
  'SOCIAL_FACEBOOK',
  'SOCIAL_INSTAGRAM',
  'SOCIAL_X',
  'SOCIAL_YOUTUBE',
  'SOCIAL_WHATSAPP',
  'TERMS_TEXT',
  'PRIVACY_TEXT',
  'ABOUT_TEXT',
  // Operational settings (System Settings screen)
  'SUPPORTED_LANGUAGES',
  'CONTENT_MODERATION',
  'AD_FREQUENCY_MIN',
  'SPONSOR_APPROVAL_REQUIRED',
  'MIN_CAMPAIGN_BUDGET',
  'INVOICE_CURRENCY',
  'AUTO_INVOICE',
  'NOTIFY_NEW_CAMPAIGN',
  'NOTIFY_USER_REPORTS',
  'NOTIFY_SYSTEM_ALERTS',
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

export type SiteSettings = Partial<Record<SiteSettingKey, string>>;

export const SITE_DEFAULTS: SiteSettings = {
  SITE_TITLE: 'Vallavan — Documentaries That Matter',
  SITE_TAGLINE: 'Tamil-first digital documentary OTT platform. Free for everyone, supported by sponsors.',
  CONTACT_EMAIL: 'hello@vallavan.in',
  DEFAULT_LANGUAGE: 'Tamil',
  SUPPORTED_LANGUAGES: 'Tamil, English',
  CONTENT_MODERATION: 'Auto + Manual',
  AD_FREQUENCY_MIN: '15',
  SPONSOR_APPROVAL_REQUIRED: 'yes',
  MIN_CAMPAIGN_BUDGET: '5000',
  INVOICE_CURRENCY: 'INR',
  AUTO_INVOICE: 'yes',
  NOTIFY_NEW_CAMPAIGN: 'Email + Push',
  NOTIFY_USER_REPORTS: 'Email',
  NOTIFY_SYSTEM_ALERTS: 'Push',
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  if (!supabase) return { ...SITE_DEFAULTS };
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error || !data) return { ...SITE_DEFAULTS };
  const out: SiteSettings = { ...SITE_DEFAULTS };
  for (const row of data as any[]) {
    if (row.value !== null && row.value !== undefined) out[row.key as SiteSettingKey] = row.value;
  }
  return out;
}

/** Upserts only the keys present in `patch`; untouched keys keep their value. */
export async function saveSiteSettings(patch: SiteSettings): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const rows = Object.entries(patch).map(([key, value]) => ({
    key,
    value: value ?? '',
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
  await logAudit(`Updated site settings (${rows.map((r) => r.key).join(', ')})`);
}
