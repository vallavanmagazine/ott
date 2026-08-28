/**
 * System Settings — operational defaults that govern advertising, billing and
 * notifications. Persisted to `site_settings` alongside the CMS copy, so the
 * backend and SEO site read one table rather than several.
 */
import { useCallback, useEffect, useState } from 'react';
import { Save, Check, Loader2, Settings as SettingsIcon, Megaphone, CreditCard, Bell } from 'lucide-react';
import {
  fetchSiteSettings, saveSiteSettings, type SiteSettings, type SiteSettingKey,
} from '@/services/site-settings';
import { useToast } from '@/components/admin/Toast';
import { LANGUAGES } from '@/lib/admin-options';
import { Field, TextInput, SelectInput, ToggleRow, SkeletonCards } from '@/components/admin/ui';

export function AdminSettings() {
  const toast = useToast();
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
  const bool = (k: SiteSettingKey) => val(k) === 'yes';

  return (
    <div className="space-y-4 max-w-2xl pb-20">
      <Section title="Platform" icon={<SettingsIcon size={15} className="text-vgold" />}>
        <Field label="Default language">
          <SelectInput value={val('DEFAULT_LANGUAGE') || 'Tamil'} onChange={(e) => set('DEFAULT_LANGUAGE', e.target.value)}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </SelectInput>
        </Field>
        <Field label="Supported languages" hint="Comma-separated.">
          <TextInput value={val('SUPPORTED_LANGUAGES')} onChange={(e) => set('SUPPORTED_LANGUAGES', e.target.value)} />
        </Field>
        <Field label="Content moderation">
          <SelectInput value={val('CONTENT_MODERATION')} onChange={(e) => set('CONTENT_MODERATION', e.target.value)}>
            {['Auto + Manual', 'Manual only', 'Auto only'].map((o) => <option key={o} value={o}>{o}</option>)}
          </SelectInput>
        </Field>
      </Section>

      <Section title="Advertising" icon={<Megaphone size={15} className="text-vgold" />}>
        <Field label="Default ad frequency (minutes)" hint="Gap between ad breaks during playback.">
          <TextInput type="number" min={1} value={val('AD_FREQUENCY_MIN')} onChange={(e) => set('AD_FREQUENCY_MIN', e.target.value)} />
        </Field>
        <Field label="Minimum campaign budget (₹)">
          <TextInput type="number" min={0} value={val('MIN_CAMPAIGN_BUDGET')} onChange={(e) => set('MIN_CAMPAIGN_BUDGET', e.target.value)} />
        </Field>
        <ToggleRow
          on={bool('SPONSOR_APPROVAL_REQUIRED')}
          onChange={(v) => set('SPONSOR_APPROVAL_REQUIRED', v ? 'yes' : 'no')}
          label="Sponsor approval required"
          sub="New campaigns wait for admin approval before serving"
        />
      </Section>

      <Section title="Payments" icon={<CreditCard size={15} className="text-vgold" />}>
        <Field label="Invoice currency">
          <SelectInput value={val('INVOICE_CURRENCY')} onChange={(e) => set('INVOICE_CURRENCY', e.target.value)}>
            {['INR', 'USD'].map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </Field>
        <ToggleRow
          on={bool('AUTO_INVOICE')}
          onChange={(v) => set('AUTO_INVOICE', v ? 'yes' : 'no')}
          label="Auto-invoice on top-up"
          sub="Generates a GST invoice whenever a wallet top-up succeeds"
        />
        <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-vmuted">
          Payment gateway: <span className="text-white/85 font-bold">Razorpay</span> — keys are configured on the API
          Settings screen and read server-side only.
        </div>
      </Section>

      <Section title="Notifications" icon={<Bell size={15} className="text-vgold" />}>
        {([
          ['NOTIFY_NEW_CAMPAIGN', 'New campaign alerts'],
          ['NOTIFY_USER_REPORTS', 'User reports'],
          ['NOTIFY_SYSTEM_ALERTS', 'System alerts'],
        ] as [SiteSettingKey, string][]).map(([key, label]) => (
          <Field key={key} label={label}>
            <SelectInput value={val(key)} onChange={(e) => set(key, e.target.value)}>
              {['Email + Push', 'Email', 'Push', 'Off'].map((o) => <option key={o} value={o}>{o}</option>)}
            </SelectInput>
          </Field>
        ))}
      </Section>

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
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl glass space-y-3.5">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">{icon} {title}</h3>
      {children}
    </div>
  );
}
