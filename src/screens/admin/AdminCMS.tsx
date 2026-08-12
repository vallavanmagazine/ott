import { useState } from 'react';
import { FileText, Edit3, Eye, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export function AdminCMS() {
  const pages = [
    { name: 'Home / Landing', slug: '/', status: 'Published', updated: 'live' },
    { name: 'About Vallavan', slug: '/about', status: 'Published', updated: 'live' },
    { name: 'Sponsor Info', slug: '/sponsors', status: 'Published', updated: 'live' },
    { name: 'Terms & Privacy', slug: '/terms', status: 'Published', updated: 'live' },
    { name: 'Creator Program', slug: '/creators', status: 'Draft', updated: 'draft' },
  ];

  const [title, setTitle] = useState('Vallavan — Documentaries That Matter');
  const [tagline, setTagline] = useState('Tamil-first digital documentary OTT platform. Free for everyone, supported by sponsors.');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!supabase) { alert('Supabase not configured'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('platform_settings').upsert([
        { key: 'SITE_TITLE', value: title, updated_at: new Date().toISOString() },
        { key: 'SITE_TAGLINE', value: tagline, updated_at: new Date().toISOString() },
      ], { onConflict: 'key' });
      if (error) throw error;
      await logAudit('Updated landing page content (CMS)');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert(`Save failed: ${(e as Error).message}`); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">Landing Pages</h3>
        <button className="px-3 py-1.5 rounded-lg bg-vred text-white text-xs font-bold active:scale-95">New Page</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pages.map((p) => (
          <div key={p.slug} className="p-4 rounded-xl glass">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-vmuted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white">{p.name}</div>
                <div className="text-[11px] text-vmuted">{p.slug}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.status === 'Published' ? 'bg-green-500/15 text-green-400' : 'bg-vgold/15 text-vgold'}`}>{p.status}</span>
                  <span className="text-[10px] text-vmuted">{p.updated}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 py-1.5 rounded-lg glass text-white text-[11px] font-bold flex items-center justify-center gap-1"><Edit3 size={12} /> Edit</button>
              <a href={p.slug === '/' ? '/' : `/#${p.slug}`} className="flex-1 py-1.5 rounded-lg glass text-vmuted text-[11px] font-bold flex items-center justify-center gap-1"><Eye size={12} /> Preview</a>
            </div>
          </div>
        ))}
      </div>

      {/* Functional quick-edit — persists to platform_settings (read by app/SEO site) */}
      <div className="p-4 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Quick Edit: Home / Landing</h3>
        <div className="space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none focus:border-vred" />
          <textarea value={tagline} onChange={(e) => setTagline(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none focus:border-vred resize-none" />
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-vred text-white text-xs font-bold active:scale-95 disabled:opacity-50 flex items-center gap-1.5">
            {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
