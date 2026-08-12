/**
 * News ticker items (manual + RSS-fetched). Read + Realtime for the overlay;
 * admin creates/removes manual items. RSS items are inserted by the playout
 * RSS fetcher (source='rss').
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export interface TickerItem {
  id: string;
  text: string;
  text_ta: string | null;
  source: string;
  priority: number;
}

const FALLBACK_TICKER: TickerItem[] = [
  { id: 'f1', text: 'Welcome to VALLAVAN TV — Tamil documentaries, 24/7.', text_ta: null, source: 'manual', priority: 0 },
];

export async function fetchTickerItems(): Promise<TickerItem[]> {
  if (!supabase) return FALLBACK_TICKER;
  const { data, error } = await supabase
    .from('ticker_items')
    .select('id, text, text_ta, source, priority')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data || data.length === 0) return FALLBACK_TICKER;
  return data as TickerItem[];
}

export function subscribeTicker(cb: () => void): () => void {
  if (!supabase) return () => {};
  const sb = supabase;
  const channel = sb
    .channel('ticker_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ticker_items' }, cb)
    .subscribe();
  return () => { sb.removeChannel(channel); };
}

export async function createTickerItem(text: string, textTa?: string, priority = 0): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('ticker_items').insert({ text, text_ta: textTa ?? null, source: 'manual', priority });
  if (error) throw error;
  await logAudit(`Added ticker item: "${text.slice(0, 40)}…"`);
}

export async function deleteTickerItem(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('ticker_items').delete().eq('id', id);
  if (error) throw error;
  await logAudit('Removed ticker item');
}
