import { useState, useEffect } from 'react';
import { KeyRound, Check, Save, ShieldCheck } from 'lucide-react';
import { SETTING_KEYS, fetchConfiguredKeys, saveSetting, type SettingKey } from '@/services/settings';

const LABELS: Record<SettingKey, string> = {
  RAZORPAY_KEY_ID: 'Razorpay Key ID (public)',
  RAZORPAY_KEY_SECRET: 'Razorpay Key Secret',
  ANTHROPIC_API_KEY: 'Anthropic API Key (AI Studio)',
  RESEND_API_KEY: 'Resend API Key (email)',
  FAST2SMS_API_KEY: 'Fast2SMS API Key (OTP/SMS)',
  WHATSAPP_API_KEY: 'WhatsApp Business API Key',
  FIREBASE_SERVER_KEY: 'Firebase Server Key (push)',
  FIREBASE_PROJECT_ID: 'Firebase Project ID',
  OPENWEATHER_API_KEY: 'OpenWeather API Key (optional)',
};

export function AdminApiSettings() {
  const [configured, setConfigured] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = () => fetchConfiguredKeys().then(setConfigured);
  useEffect(() => { load(); }, []);

  const save = async (key: SettingKey) => {
    const val = values[key]?.trim();
    if (!val) return;
    setSavingKey(key);
    try { await saveSetting(key, val); setValues((v) => ({ ...v, [key]: '' })); await load(); }
    catch (e) { alert(`Save failed: ${(e as Error).message}`); }
    finally { setSavingKey(null); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-vred/10 border border-vred/25">
        <ShieldCheck size={18} className="text-vred flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/90 leading-relaxed">
          Keys are stored <span className="font-bold">write-only</span> — values are never read back into the browser and never ship in the client bundle. The backend reads them server-side (service role). You'll see a green check once a key is configured.
        </p>
      </div>

      <div className="space-y-2.5">
        {SETTING_KEYS.map((key) => {
          const isSet = configured.includes(key);
          return (
            <div key={key} className="p-3 rounded-xl glass">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound size={14} className="text-vmuted" />
                <span className="text-sm font-semibold text-white flex-1">{LABELS[key]}</span>
                {isSet ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-400"><Check size={12} /> Configured</span>
                ) : (
                  <span className="text-[10px] font-bold text-vmuted">Not set</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={values[key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                  placeholder={isSet ? '•••••••• (enter to replace)' : 'Paste key…'}
                  className="flex-1 px-3 py-2 rounded-lg glass text-sm text-white placeholder:text-vmuted outline-none font-mono"
                />
                <button
                  onClick={() => save(key)}
                  disabled={savingKey === key || !values[key]?.trim()}
                  className="px-3 py-2 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Save size={13} /> {savingKey === key ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-vmuted">Code: <span className="font-mono">supabase/phase5_19.sql</span> must be applied for the platform_settings table.</p>
    </div>
  );
}
