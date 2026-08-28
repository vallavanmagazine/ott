/**
 * Broadcast Control — the live overlay switchboard for VALLAVAN TV.
 *
 * Every control writes straight to the single-row `broadcast_config` table.
 * Viewers subscribe to that row over Supabase Realtime (see hooks/useBroadcast),
 * so a toggle here changes what is on screen without a page reload — which is
 * why each control saves on change rather than behind a Save button.
 */
import { useCallback, useEffect, useState } from 'react';
import { Radio, Plus, Trash2, Newspaper, Rss, Zap, Tv, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  fetchBroadcastConfig, updateBroadcastConfig,
  DEFAULT_BROADCAST_CONFIG, type BroadcastConfig,
} from '@/services/broadcast';
import { fetchTickerItems, createTickerItem, deleteTickerItem, type TickerItem } from '@/services/ticker';
import { createNewsItem } from '@/services/news-feed';
import { fetchSponsorOptions } from '@/services/admin-campaigns';
import { logAudit } from '@/services/admin-writes';
import { formatDateShort } from '@/lib/transforms';
import { useToast } from '@/components/admin/Toast';
import { LOGO_POSITIONS, TICKER_SPEEDS } from '@/lib/admin-options';
import {
  Field, TextInput, TextArea, SelectInput, ToggleRow, InlineToggle,
  SkeletonCards, EmptyState, IconButton,
} from '@/components/admin/ui';

interface RssFeed {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  last_fetched_at: string | null;
}

export function AdminBroadcast() {
  const toast = useToast();

  const [cfg, setCfg] = useState<BroadcastConfig>(DEFAULT_BROADCAST_CONFIG);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [rss, setRss] = useState<RssFeed[]>([]);
  const [sponsors, setSponsors] = useState<{ id: string; name: string }[]>([]);

  const [newTick, setNewTick] = useState('');
  const [newTickTa, setNewTickTa] = useState('');
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [rssName, setRssName] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [posting, setPosting] = useState(false);

  const loadTicker = useCallback(() => fetchTickerItems().then(setTicker).catch(() => {}), []);

  const loadRss = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('rss_feeds')
      .select('id, name, url, is_active, last_fetched_at')
      .order('created_at', { ascending: false });
    setRss((data ?? []) as RssFeed[]);
  }, []);

  useEffect(() => {
    fetchBroadcastConfig().then((c) => { setCfg(c); setLoading(false); }).catch(() => setLoading(false));
    loadTicker();
    loadRss();
    fetchSponsorOptions().then(setSponsors).catch(() => {});
  }, [loadTicker, loadRss]);

  /** Optimistic patch — the overlay reacts live, so latency here is visible. */
  const patch = async (p: Partial<BroadcastConfig>, label?: string) => {
    const previous = cfg;
    setCfg((c) => ({ ...c, ...p }));
    try {
      await updateBroadcastConfig(p);
      if (label) toast.success(label);
    } catch (e) {
      setCfg(previous);
      toast.error((e as Error).message);
    }
  };

  const addTicker = async () => {
    if (!newTick.trim()) { toast.error('Enter the ticker text'); return; }
    try {
      await createTickerItem(newTick.trim(), newTickTa.trim() || undefined);
      setNewTick(''); setNewTickTa('');
      await loadTicker();
      toast.success('Ticker item added');
    } catch (e) { toast.error((e as Error).message); }
  };

  const removeTicker = async (id: string) => {
    try { await deleteTickerItem(id); await loadTicker(); toast.success('Ticker item removed'); }
    catch (e) { toast.error((e as Error).message); }
  };

  const postNews = async () => {
    if (!newsTitle.trim() || !newsBody.trim()) { toast.error('Title and full report are both required'); return; }
    setPosting(true);
    try {
      await createNewsItem({ title60: newsTitle, fullText200: newsBody });
      setNewsTitle(''); setNewsBody('');
      await loadTicker();
      toast.success('Posted to Feed and the ticker');
    } catch (e) { toast.error((e as Error).message); } finally { setPosting(false); }
  };

  const addRss = async () => {
    if (!supabase) { toast.error('Supabase not configured'); return; }
    if (!rssUrl.trim()) { toast.error('Enter the feed URL'); return; }
    try {
      const { error } = await supabase.from('rss_feeds').insert({ name: rssName.trim() || 'Feed', url: rssUrl.trim(), is_active: true });
      if (error) throw error;
      await logAudit(`Added RSS feed ${rssName.trim() || rssUrl.trim()}`);
      setRssName(''); setRssUrl('');
      await loadRss();
      toast.success('RSS feed added');
    } catch (e) { toast.error((e as Error).message); }
  };

  const toggleRss = async (feed: RssFeed) => {
    if (!supabase) return;
    try {
      const { error } = await supabase.from('rss_feeds').update({ is_active: !feed.is_active }).eq('id', feed.id);
      if (error) throw error;
      await logAudit(`${feed.is_active ? 'Disabled' : 'Enabled'} RSS feed ${feed.name}`);
      await loadRss();
      toast.success(`${feed.name} ${feed.is_active ? 'disabled' : 'enabled'}`);
    } catch (e) { toast.error((e as Error).message); }
  };

  const deleteRss = async (feed: RssFeed) => {
    if (!supabase) return;
    try {
      await supabase.from('rss_feeds').delete().eq('id', feed.id);
      await logAudit(`Removed RSS feed ${feed.name}`);
      await loadRss();
      toast.success('Feed removed');
    } catch (e) { toast.error((e as Error).message); }
  };

  if (loading) return <SkeletonCards count={4} />;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Channel go-live */}
      <div className={`p-4 rounded-xl border ${cfg.channel_live ? 'bg-vred/10 border-vred/40' : 'bg-vgold/10 border-vgold/30'}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.channel_live ? 'bg-vred' : 'bg-vgold'}`}>
              {cfg.channel_live ? <Radio size={20} className="text-white" /> : <Tv size={20} className="text-black" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black text-white">VALLAVAN TV Channel</div>
              <div className="text-[11px] text-vmuted">
                {cfg.channel_live
                  ? 'LIVE — viewers see the player and the broadcast overlay.'
                  : 'Coming Soon mode — viewers see the promo screen.'}
              </div>
            </div>
          </div>
          <button
            onClick={() => patch({ channel_live: !cfg.channel_live }, cfg.channel_live ? 'Channel offline' : 'Channel is LIVE')}
            className={`px-5 py-2.5 rounded-full text-xs font-black active:scale-95 transition flex-shrink-0 ${
              cfg.channel_live ? 'bg-vred text-white' : 'bg-vgold text-black'
            }`}
          >
            {cfg.channel_live ? 'GO OFFLINE' : 'GO LIVE'}
          </button>
        </div>
      </div>

      {/* Channel bug */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white">Channel Bug (Logo)</h3>
        <ToggleRow on={cfg.logo_enabled} onChange={(v) => patch({ logo_enabled: v })} label="Show logo overlay" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position">
            <SelectInput value={cfg.logo_position} onChange={(e) => patch({ logo_position: e.target.value })}>
              {LOGO_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </SelectInput>
          </Field>
          <Field label="Opacity" counter={`${cfg.logo_opacity}%`}>
            <input
              type="range"
              min={10}
              max={100}
              value={cfg.logo_opacity}
              onChange={(e) => setCfg((c) => ({ ...c, logo_opacity: Number(e.target.value) }))}
              onMouseUp={(e) => patch({ logo_opacity: Number((e.target as HTMLInputElement).value) })}
              onTouchEnd={(e) => patch({ logo_opacity: Number((e.target as HTMLInputElement).value) })}
              className="w-full accent-vred mt-3"
            />
          </Field>
        </div>
      </section>

      {/* Lower third */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white">Lower Third</h3>
        <ToggleRow on={cfg.lower_third_enabled} onChange={(v) => patch({ lower_third_enabled: v })} label="Show lower third" sub="The NOW / NEXT strip" />
        <ToggleRow
          on={cfg.lower_third_auto}
          onChange={(v) => patch({ lower_third_auto: v })}
          label="Auto from schedule"
          sub="Pulls the current and next programme from live_slots"
        />
        {!cfg.lower_third_auto && (
          <Field label="Custom lower-third text">
            <div className="flex gap-2">
              <TextInput
                value={cfg.lower_third_text}
                onChange={(e) => setCfg((c) => ({ ...c, lower_third_text: e.target.value }))}
                placeholder="Text shown instead of the schedule"
              />
              <button
                onClick={() => patch({ lower_third_text: cfg.lower_third_text }, 'Lower third updated')}
                className="px-4 rounded-xl bg-vred text-white text-xs font-bold active:scale-95"
              >
                Set
              </button>
            </div>
          </Field>
        )}
      </section>

      {/* Ticker */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white">News Ticker</h3>
        <ToggleRow on={cfg.ticker_enabled} onChange={(v) => patch({ ticker_enabled: v })} label="Show ticker" />
        <Field label="Scroll speed">
          <div className="flex gap-2">
            {TICKER_SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => patch({ ticker_speed: s }, `Ticker speed: ${s}`)}
                className={`px-3.5 py-2 rounded-full text-[11px] font-bold ${cfg.ticker_speed === s ? 'bg-vred text-white' : 'glass text-vmuted'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Manual ticker items</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <TextInput value={newTick} onChange={(e) => setNewTick(e.target.value)} placeholder="Ticker line (English)" />
            <TextInput className="font-tamil" value={newTickTa} onChange={(e) => setNewTickTa(e.target.value)} placeholder="தமிழ் வரி (optional)" />
          </div>
          <button onClick={addTicker} className="px-3 py-2 rounded-lg bg-vred text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
            <Plus size={14} /> Add ticker item
          </button>
          <div className="space-y-1.5 pt-1">
            {ticker.length === 0 && <p className="text-[11px] text-vmuted">No ticker items yet.</p>}
            {ticker.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg glass">
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-[8px] font-bold uppercase text-vmuted flex-shrink-0">{t.source}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{t.text}</div>
                  {t.text_ta && <div className="text-[11px] font-tamil text-vmuted truncate">{t.text_ta}</div>}
                </div>
                {t.source === 'manual' && (
                  <IconButton onClick={() => removeTicker(t.id)} title="Remove" danger><Trash2 size={13} /></IconButton>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breaking news */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap size={15} className="text-vred" /> Breaking News
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold ${cfg.breaking_active ? 'bg-vred text-white' : 'bg-white/10 text-vmuted'}`}>
            {cfg.breaking_active ? 'ON AIR' : 'OFF'}
          </span>
        </h3>
        <Field label="Headline">
          <TextInput value={cfg.breaking_headline} onChange={(e) => setCfg((c) => ({ ...c, breaking_headline: e.target.value }))} placeholder="Breaking headline" />
        </Field>
        <Field label="Sub-text">
          <TextInput value={cfg.breaking_body} onChange={(e) => setCfg((c) => ({ ...c, breaking_body: e.target.value }))} placeholder="Optional detail line" />
        </Field>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!cfg.breaking_headline.trim()) { toast.error('Enter a headline first'); return; }
              patch({ breaking_headline: cfg.breaking_headline, breaking_body: cfg.breaking_body, breaking_active: true }, 'Breaking news is ON AIR');
            }}
            className="flex-1 py-2.5 rounded-full bg-vred text-white text-xs font-bold active:scale-95"
          >
            Activate
          </button>
          <button
            onClick={() => patch({ breaking_active: false }, 'Breaking news deactivated')}
            className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold active:scale-95"
          >
            Deactivate
          </button>
        </div>
      </section>

      {/* Sponsor strips */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white">Sponsor Strips</h3>
        <ToggleRow on={cfg.lband_enabled} onChange={(v) => patch({ lband_enabled: v })} label="L-Band sponsor strip" />
        {cfg.lband_enabled && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="L-Band sponsor">
              <SelectInput value={cfg.lband_sponsor_id ?? ''} onChange={(e) => patch({ lband_sponsor_id: e.target.value || null }, 'L-Band sponsor set')}>
                <option value="">None</option>
                {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="Position">
              <SelectInput value={cfg.lband_position} onChange={(e) => patch({ lband_position: e.target.value })}>
                <option value="right">right</option>
                <option value="left">left</option>
              </SelectInput>
            </Field>
          </div>
        )}
        <ToggleRow on={cfg.powered_by_enabled} onChange={(v) => patch({ powered_by_enabled: v })} label="Powered-by strip" />
        {cfg.powered_by_enabled && (
          <Field label="Powered-by sponsor">
            <SelectInput value={cfg.powered_by_sponsor_id ?? ''} onChange={(e) => patch({ powered_by_sponsor_id: e.target.value || null }, 'Powered-by sponsor set')}>
              <option value="">None</option>
              {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </SelectInput>
          </Field>
        )}
      </section>

      {/* Weather + ad break */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white">Widgets & Timing</h3>
        <ToggleRow on={cfg.weather_enabled} onChange={(v) => patch({ weather_enabled: v })} label="Weather widget" sub={cfg.weather_city} />
        {cfg.weather_enabled && (
          <Field label="Weather city">
            <div className="flex gap-2">
              <TextInput value={cfg.weather_city} onChange={(e) => setCfg((c) => ({ ...c, weather_city: e.target.value }))} />
              <button onClick={() => patch({ weather_city: cfg.weather_city }, 'Weather city updated')} className="px-4 rounded-xl bg-vred text-white text-xs font-bold active:scale-95">Set</button>
            </div>
          </Field>
        )}
        <Field label="Ad break duration (seconds)" hint="Length of the break inserted between programmes.">
          <div className="flex gap-2">
            <TextInput
              type="number"
              min={0}
              value={cfg.ad_break_duration_sec}
              onChange={(e) => setCfg((c) => ({ ...c, ad_break_duration_sec: Number(e.target.value) }))}
            />
            <button
              onClick={() => patch({ ad_break_duration_sec: cfg.ad_break_duration_sec }, 'Ad break duration saved')}
              className="px-4 rounded-xl bg-vred text-white text-xs font-bold active:scale-95 flex items-center gap-1.5"
            >
              <Clock size={13} /> Set
            </button>
          </div>
        </Field>
      </section>

      {/* Quick news post */}
      <section className="p-4 rounded-xl glass space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Newspaper size={15} className="text-vgold" /> Quick News Post</h3>
        <Field label="Card title" counter={`${newsTitle.length}/60`}>
          <TextInput value={newsTitle} maxLength={60} onChange={(e) => setNewsTitle(e.target.value)} placeholder="Headline shown on the feed card" />
        </Field>
        <Field label="Full report" counter={`${newsBody.length}/200`}>
          <TextArea rows={3} maxLength={200} value={newsBody} onChange={(e) => setNewsBody(e.target.value)} placeholder="Scrolls in the ticker and posts to the Feed" />
        </Field>
        <button onClick={postNews} disabled={posting} className="w-full py-2.5 rounded-full bg-vgold text-black text-xs font-bold disabled:opacity-50 active:scale-95">
          {posting ? 'Posting...' : 'Post News (Feed + Ticker)'}
        </button>
      </section>

      {/* RSS */}
      <section className="p-4 rounded-xl glass space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Rss size={15} className="text-vgold" /> RSS Feeds</h3>
        <div className="flex gap-2 flex-wrap">
          <TextInput className="!w-32" value={rssName} onChange={(e) => setRssName(e.target.value)} placeholder="Name" />
          <div className="flex-1 min-w-[200px]">
            <TextInput value={rssUrl} onChange={(e) => setRssUrl(e.target.value)} placeholder="https://…/feed.xml" />
          </div>
          <button onClick={addRss} className="px-3 rounded-xl bg-vred text-white text-xs font-bold flex items-center gap-1 active:scale-95">
            <Plus size={14} /> Add
          </button>
        </div>
        {rss.length === 0 ? (
          <EmptyState title="No RSS feeds configured" hint="The playout fetcher pulls active feeds into the ticker every 15 minutes." />
        ) : (
          <div className="space-y-1.5">
            {rss.map((f) => (
              <div key={f.id} className="flex items-center gap-2 p-2.5 rounded-lg glass">
                <InlineToggle on={f.is_active} onClick={() => toggleRss(f)} title="Enable / disable feed" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white">{f.name}</div>
                  <div className="text-[10px] text-vmuted truncate">{f.url}</div>
                </div>
                <span className="text-[9px] text-vmuted flex-shrink-0">
                  {f.last_fetched_at ? `fetched ${formatDateShort(f.last_fetched_at)}` : 'never fetched'}
                </span>
                <IconButton onClick={() => deleteRss(f)} title="Remove feed" danger><Trash2 size={13} /></IconButton>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
