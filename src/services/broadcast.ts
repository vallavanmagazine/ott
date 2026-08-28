/**
 * Broadcast config — the single-row control table for the Live TV overlay.
 * Read + Realtime-subscribe for viewers; admin updates from the control panel.
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export interface BroadcastConfig {
  id: number;
  channel_live: boolean;
  logo_enabled: boolean;
  logo_position: string;
  logo_opacity: number;
  ticker_enabled: boolean;
  ticker_speed: string;
  lower_third_enabled: boolean;
  lower_third_auto: boolean;
  lower_third_text: string;
  lband_enabled: boolean;
  lband_sponsor_id: string | null;
  lband_position: string;
  breaking_active: boolean;
  breaking_headline: string;
  breaking_body: string;
  weather_enabled: boolean;
  weather_city: string;
  powered_by_enabled: boolean;
  powered_by_sponsor_id: string | null;
  ad_break_duration_sec: number;
}

export const DEFAULT_BROADCAST_CONFIG: BroadcastConfig = {
  id: 1,
  channel_live: false,
  logo_enabled: true,
  logo_position: 'bottom-right',
  logo_opacity: 70,
  ticker_enabled: true,
  ticker_speed: 'medium',
  lower_third_enabled: true,
  lower_third_auto: true,
  lower_third_text: '',
  lband_enabled: false,
  lband_sponsor_id: null,
  lband_position: 'right',
  breaking_active: false,
  breaking_headline: '',
  breaking_body: '',
  weather_enabled: true,
  weather_city: 'Chennai',
  powered_by_enabled: false,
  powered_by_sponsor_id: null,
  ad_break_duration_sec: 60,
};

export async function fetchBroadcastConfig(): Promise<BroadcastConfig> {
  if (!supabase) return DEFAULT_BROADCAST_CONFIG;
  const { data, error } = await supabase.from('broadcast_config').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return DEFAULT_BROADCAST_CONFIG;
  return { ...DEFAULT_BROADCAST_CONFIG, ...(data as Partial<BroadcastConfig>) };
}

/** Subscribe to config changes (Supabase Realtime). Returns an unsubscribe fn. */
export function subscribeBroadcastConfig(cb: (cfg: BroadcastConfig) => void): () => void {
  if (!supabase) return () => {};
  const sb = supabase;
  const channel = sb
    .channel('broadcast_config_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'broadcast_config' }, (payload) => {
      cb({ ...DEFAULT_BROADCAST_CONFIG, ...(payload.new as Partial<BroadcastConfig>) });
    })
    .subscribe();
  return () => { sb.removeChannel(channel); };
}

/** Admin: patch the config row. */
export async function updateBroadcastConfig(patch: Partial<BroadcastConfig>): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('broadcast_config')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 1);
  if (error) throw error;
  await logAudit('Updated broadcast config');
}
