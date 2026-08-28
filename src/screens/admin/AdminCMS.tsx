/**
 * CMS Settings — public site configuration and long-form legal/about copy.
 *
 * These persist to `site_settings`, which is publicly readable (unlike
 * `platform_settings`, which holds API secrets and has no SELECT policy — see
 * supabase/admin_dashboard.sql). Anything a page needs to render must live here.
 */
import { useCallback, useEffect, useState } from 'react';
import { Save, Check, Globe, Share2, FileText, Loader2 } from 'lucide-react';
import {
  fetchSiteSettings, saveSiteSettings, type SiteSettings, type SiteSettingKey,
} from '@/services/site-settings';
import { useToast } from '@/components/admin/Toast';
import { LANGUAGES } from '@/lib/admin-options';
import { Field, TextInput, TextArea, SelectInput, SkeletonCards, Tabs } from '@/components/admin/ui';

type Tab = 'site' | 'social' | 'legal';

export function AdminCMS() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('site');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [dirty, setDirty] = useState<Set<SiteSettingKey>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setSettings(await fetchSiteSettings());
    setDirty(new Set());
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key: SiteSettingKey, value: string) => {
    setSettings((s) => ({ ...(s ?? {}), [key]: value }));
    setDirty((d) => new Set(d).add(key));
  };

  /** Only send the keys the admin actually touched — avoids clobbering. */
  const save = async () => {
    if (!settings || dirty.size === 0) { toast.info('Nothing to save'); return; }
    setSaving(true);
    try {
      const patch: SiteSettings = {};
      for (const key of dirty) patch[key] = settings[key] ?? '';
      await saveSiteSettings(patch);
      toast.success(`Saved ${dirty.size} setting${dirty.size > 1 ? 's' : ''}`);
      setDirty(new Set());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <SkeletonCards count={4} />;

  const val = (k: SiteSettingKey) => settings[k] ?? '';

  return (
    <div className="space-y-4 max-w-3xl pb-20">
      <Tabs<Tab>
        tabs={[
          { key: 'site', label: 'Site' },
          { key: 'social', label: 'Social Links' },
          { key: 'legal', label: 'Legal & About' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'site' && (
        <div className="p-4 rounded-xl glass space-y-3.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe size={15} className="text-vgold" /> Site Configuration</h3>
          <Field label="Site title" hint="Browser tab title and SEO <title>">
            <TextInput value={val('SITE_TITLE')} onChange={(e) => set('SITE_TITLE', e.target.value)} />
          </Field>
          <Field label="Tagline">
            <TextArea rows={2} value={val('SITE_TAGLINE')} onChange={(e) => set('SITE_TAGLINE', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact email">
              <TextInput type="email" value={val('CONTACT_EMAIL')} onChange={(e) => set('CONTACT_EMAIL', e.target.value)} placeholder="hello@vallavan.in" />
            </Field>
            <Field label="Contact phone">
              <TextInput value={val('CONTACT_PHONE')} onChange={(e) => set('CONTACT_PHONE', e.target.value)} placeholder="+91…" />
            </Field>
          </div>
          <Field label="Logo URL">
            <TextInput value={val('LOGO_URL')} onChange={(e) => set('LOGO_URL', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Default language">
            <SelectInput value={val('DEFAULT_LANGUAGE') || 'Tamil'} onChange={(e) => set('DEFAULT_LANGUAGE', e.target.value)}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </SelectInput>
          </Field>
        </div>
      )}

      {tab === 'social' && (
        <div className="p-4 rounded-xl glass space-y-3.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><Share2 size={15} className="text-vgold" /> Social Media</h3>
          <Field label="Facebook page URL">
            <TextInput value={val('SOCIAL_FACEBOOK')} onChange={(e) => set('SOCIAL_FACEBOOK', e.target.value)} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="Instagram URL">
            <TextInput value={val('SOCIAL_INSTAGRAM')} onChange={(e) => set('SOCIAL_INSTAGRAM', e.target.value)} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="X (Twitter) URL">
            <TextInput value={val('SOCIAL_X')} onChange={(e) => set('SOCIAL_X', e.target.value)} placeholder="https://x.com/…" />
          </Field>
          <Field label="YouTube channel URL">
            <TextInput value={val('SOCIAL_YOUTUBE')} onChange={(e) => set('SOCIAL_YOUTUBE', e.target.value)} placeholder="https://youtube.com/@…" />
          </Field>
          <Field label="WhatsApp channel / number">
            <TextInput value={val('SOCIAL_WHATSAPP')} onChange={(e) => set('SOCIAL_WHATSAPP', e.target.value)} placeholder="https://wa.me/…" />
          </Field>
        </div>
      )}

      {tab === 'legal' && (
        <div className="p-4 rounded-xl glass space-y-3.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText size={15} className="text-vgold" /> Legal & About</h3>
          <Field label="About page content" counter={`${val('ABOUT_TEXT').length} chars`}>
            <TextArea rows={8} value={val('ABOUT_TEXT')} onChange={(e) => set('ABOUT_TEXT', e.target.value)} placeholder="Who Vallavan is, and why…" />
          </Field>
          <Field label="Terms & conditions" counter={`${val('TERMS_TEXT').length} chars`}>
            <TextArea rows={10} value={val('TERMS_TEXT')} onChange={(e) => set('TERMS_TEXT', e.target.value)} />
          </Field>
          <Field label="Privacy policy" counter={`${val('PRIVACY_TEXT').length} chars`}>
            <TextArea rows={10} value={val('PRIVACY_TEXT')} onChange={(e) => set('PRIVACY_TEXT', e.target.value)} />
          </Field>
        </div>
      )}

      {/* Sticky save bar — the legal tab is long, so Save must stay reachable. */}
      <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-vblack/95 backdrop-blur-xl border-t border-white/8 flex items-center gap-3">
        <span className="text-[11px] text-vmuted flex-1">
          {dirty.size === 0 ? 'All changes saved' : `${dirty.size} unsaved change${dirty.size > 1 ? 's' : ''}`}
        </span>
        <button
          onClick={save}
          disabled={saving || dirty.size === 0}
          className="px-5 py-2.5 rounded-full bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95 disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : dirty.size === 0 ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
