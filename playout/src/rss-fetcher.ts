import Parser from 'rss-parser';
import { supabase } from './supabase';

const parser = new Parser();

/**
 * Every RSS_INTERVAL_MIN minutes: read active rss_feeds, fetch each, insert new
 * headlines into ticker_items (source='rss', 24h expiry), dedupe by text.
 * Requires no manual action once feed URLs are configured in the admin panel.
 */
export function startRssFetcher() {
  const intervalMin = Number(process.env.RSS_INTERVAL_MIN) || 15;

  const run = async () => {
    try {
      const { data: feeds } = await supabase.from('rss_feeds').select('id, url').eq('is_active', true);
      for (const feed of feeds ?? []) {
        try {
          const parsed = await parser.parseURL(feed.url);
          for (const item of (parsed.items ?? []).slice(0, 10)) {
            const text = (item.title ?? '').slice(0, 200);
            if (!text) continue;
            const { data: exists } = await supabase.from('ticker_items').select('id').eq('text', text).maybeSingle();
            if (exists) continue;
            await supabase.from('ticker_items').insert({
              text, source: 'rss', priority: 1,
              expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            });
          }
          await supabase.from('rss_feeds').update({ last_fetched_at: new Date().toISOString() }).eq('id', feed.id);
        } catch (e) { console.warn('[rss] feed failed', feed.url, e); }
      }
    } catch (e) { console.error('[rss] run error', e); }
  };

  run();
  setInterval(run, intervalMin * 60_000);
}
