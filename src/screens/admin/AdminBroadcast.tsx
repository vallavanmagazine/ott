import { useState, useEffect } from 'react';
import { Radio, Plus, Trash2, Newspaper, Rss, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  fetchBroadcastConfig, updateBroadcastConfig,
  DEFAULT_BROADCAST_CONFIG, type BroadcastConfig,
} from '@/services/broadcast';
import { fetchTickerItems, createTickerItem, deleteTickerItem, type TickerItem } from '@/services/ticker';
import { createNewsItem } from '@/services/news-feed';

function Toggle({ on, onClick, label, sub }: { on: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-3 rounded-xl glass">
      <div className="text-left">
        <div className="text-sm font-semibold text-white">{label}</div>
        {sub && <div className="text-[10px] text-vmuted">{sub}</div>}
      </div>
      <div className={`w-11 h-6 rounded-full p-0.5 transition ${on ? 'bg-vred' : 'bg-white/15'}`}>
        <div className={`w-5 h-5 rounded-full bg-white transition ${on ? 'translate-x-5' : ''}`} />
      </div>
    </button>
  );
}

export function AdminBroadcast() {
  const [cfg, setCfg] = useState<BroadcastConfig>(DEFAULT_BROADCAST_CONFIG);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [rss, setRss] = useState<{ id: string; name: string; url: string; is_active: boolean }[]>([]);
  const [newTick, setNewTick] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [rssName, setRssName] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTicker = () => fetchTickerItems().then(setTicker);
  const loadRss = () => {
    if (!supabase) return;
    supabase.from('rss_feeds').select('id, name, url, is_active').order('created_at', { ascending: false })
      .then(({ data }) => setRss(data ?? []));
  };
  useEffect(() => { fetchBroadcastConfig().then(setCfg); loadTicker(); loadRss(); }, []);

  const patch = async (p: Partial<BroadcastConfig>) => {
    setCfg((c) => ({ ...c, ...p }));
    try { await updateBroadcastConfig(p); } catch (e) { alert(`Save failed: ${(e as Error).message}`); }
  };

  const addTicker = async () => {
    if (!newTick.trim()) return;
    try { await createTickerItem(newTick.trim()); setNewTick(''); await loadTicker(); }
    catch (e) { alert(`Failed: ${(e as Error).message}`); }
  };

  const postNews = async () => {
    if (!newsTitle.trim() || !newsBody.trim()) { alert('Title and full report required'); return; }
    setSaving(true);
    try { await createNewsItem({ title60: newsTitle, fullText200: newsBody }); setNewsTitle(''); setNewsBody(''); await loadTicker(); alert('Posted to Feed + ticker.'); }
    catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setSaving(false); }
  };

  const addRss = async () => {
    if (!supabase || !rssUrl.trim()) return;
    try {
      const { error } = await supabase.from('rss_feeds').insert({ name: rssName.trim() || 'Feed', url: rssUrl.trim() });
      if (error) throw error;
      setRssName(''); setRssUrl(''); loadRss();
    } catch (e) { alert(`Failed: ${(e as Error).message}`); }
  };
  const delRss = async (id: string) => {
    if (!supabase) return;
    await supabase.from('rss_feeds').delete().eq('id', id);
    loadRss();
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Channel go-live switch */}
      <section>
        <div className={`p-4 rounded-xl border ${cfg.channel_live ? 'bg-vred/10 border-vred/40' : 'bg-vgold/10 border-vgold/30'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <Radio size={16} className={cfg.channel_live ? 'text-vred' : 'text-vgold'} />
                VALLAVAN TV Channel
              </div>
              <div className="text-[11px] text-vmuted mt-0.5">
                {cfg.channel_live ? 'LIVE — viewers see the player + broadcast overlay.' : 'Coming Soon mode — viewers see the promo screen. Flip on when playout is running.'}
              </div>
            </div>
            <button onClick={() => patch({ channel_live: !cfg.channel_live })} className={`px-4 py-2 rounded-full text-xs font-black active:scale-95 transition ${cfg.channel_live ? 'bg-vred text-white' : 'bg-vgold text-black'}`}>
              {cfg.channel_live ? 'GO OFFLINE' : 'GO LIVE'}
            </button>
          </div>
        </div>
      </section>

      {/* Overlay toggles */}
      <section>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Radio size={16} className="text-vred" /> Overlay Layers</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          <Toggle on={cfg.logo_enabled} onClick={() => patch({ logo_enabled: !cfg.logo_enabled })} label="Channel Bug (logo)" sub={cfg.logo_position} />
          <Toggle on={cfg.ticker_enabled} onClick={() => patch({ ticker_enabled: !cfg.ticker_enabled })} label="News Ticker" sub={`speed: ${cfg.ticker_speed}`} />
          <Toggle on={cfg.lower_third_enabled} onClick={() => patch({ lower_third_enabled: !cfg.lower_third_enabled })} label="Lower Third (NOW/NEXT)" />
          <Toggle on={cfg.weather_enabled} onClick={() => patch({ weather_enabled: !cfg.weather_enabled })} label="Weather Widget" sub={cfg.weather_city} />
          <Toggle on={cfg.lband_enabled} onClick={() => patch({ lband_enabled: !cfg.lband_enabled })} label="L-Band Sponsor Strip" />
          <Toggle on={cfg.powered_by_enabled} onClick={() => patch({ powered_by_enabled: !cfg.powered_by_enabled })} label="Powered-by Strip" />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Ticker speed</span>
          {['slow', 'medium', 'fast'].map((s) => (
            <button key={s} onClick={() => patch({ ticker_speed: s })} className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.ticker_speed === s ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{s}</button>
          ))}
        </div>
      </section>

      {/* Breaking news */}
      <section>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap size={16} className="text-vred" /> Breaking News</h3>
        <div className="p-3 rounded-xl glass space-y-2">
          <input value={cfg.breaking_headline} onChange={(e) => setCfg({ ...cfg, breaking_headline: e.target.value })} placeholder="Breaking headline" className="w-full px-3 py-2 rounded-lg glass text-sm text-white outline-none" />
          <input value={cfg.breaking_body} onChange={(e) => setCfg({ ...cfg, breaking_body: e.target.value })} placeholder="Sub-text (optional)" className="w-full px-3 py-2 rounded-lg glass text-sm text-white outline-none" />
          <div className="flex gap-2">
            <button onClick={() => patch({ breaking_headline: cfg.breaking_headline, breaking_body: cfg.breaking_body, breaking_active: true })} className="flex-1 py-2 rounded-full bg-vred text-white text-xs font-bold">Activate Breaking</button>
            <button onClick={() => patch({ breaking_active: false })} className="flex-1 py-2 rounded-full glass text-white text-xs font-bold">Deactivate</button>
          </div>
          <div className="text-[10px] text-vmuted">Status: {cfg.breaking_active ? 'LIVE on air' : 'off'}</div>
        </div>
      </section>

      {/* Quick news post */}
      <section>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Newspaper size={16} className="text-vgold" /> Quick News Post</h3>
        <div className="p-3 rounded-xl glass space-y-2">
          <input value={newsTitle} maxLength={60} onChange={(e) => setNewsTitle(e.target.value)} placeholder="Card title (60 max)" className="w-full px-3 py-2 rounded-lg glass text-sm text-white outline-none" />
          <div className="text-right text-[9px] text-vmuted">{newsTitle.length}/60</div>
          <textarea value={newsBody} maxLength={200} onChange={(e) => setNewsBody(e.target.value)} placeholder="Full report (200 max — scrolls in ticker)" rows={2} className="w-full px-3 py-2 rounded-lg glass text-sm text-white outline-none resize-none" />
          <div className="text-right text-[9px] text-vmuted">{newsBody.length}/200</div>
          <button onClick={postNews} disabled={saving} className="w-full py-2 rounded-full bg-vgold text-black text-xs font-bold disabled:opacity-50">{saving ? 'Posting…' : 'Post News (Feed + Ticker)'}</button>
        </div>
      </section>

      {/* Ticker items */}
      <section>
        <h3 className="text-sm font-bold text-white mb-3">Manual Ticker Items</h3>
        <div className="flex gap-2 mb-2">
          <input value={newTick} onChange={(e) => setNewTick(e.target.value)} placeholder="Add a ticker line…" className="flex-1 px-3 py-2 rounded-lg glass text-sm text-white outline-none" />
          <button onClick={addTicker} className="px-3 py-2 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1"><Plus size={14} /> Add</button>
        </div>
        <div className="space-y-1.5">
          {ticker.map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg glass">
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] font-bold uppercase text-vmuted">{t.source}</span>
              <span className="flex-1 text-xs text-white truncate">{t.text}</span>
              {t.source === 'manual' && <button onClick={() => deleteTickerItem(t.id).then(loadTicker)} className="text-vmuted hover:text-red-400"><Trash2 size={13} /></button>}
            </div>
          ))}
        </div>
      </section>

      {/* RSS feeds */}
      <section>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Rss size={16} className="text-vgold" /> RSS Feeds (auto-ticker)</h3>
        <div className="flex gap-2 mb-2">
          <input value={rssName} onChange={(e) => setRssName(e.target.value)} placeholder="Name" className="w-32 px-3 py-2 rounded-lg glass text-sm text-white outline-none" />
          <input value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="https://…/feed.xml" className="flex-1 px-3 py-2 rounded-lg glass text-sm text-white outline-none" />
          <button onClick={addRss} className="px-3 py-2 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1"><Plus size={14} /></button>
        </div>
        <div className="space-y-1.5">
          {rss.map((f) => (
            <div key={f.id} className="flex items-center gap-2 p-2.5 rounded-lg glass">
              <span className="text-xs font-bold text-white">{f.name}</span>
              <span className="flex-1 text-[11px] text-vmuted truncate">{f.url}</span>
              <button onClick={() => delRss(f.id)} className="text-vmuted hover:text-red-400"><Trash2 size={13} /></button>
            </div>
          ))}
          <p className="text-[10px] text-vmuted">The playout RSS fetcher pulls these every 15 min into the ticker.</p>
        </div>
      </section>
    </div>
  );
}
