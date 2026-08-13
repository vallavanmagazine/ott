import { useEffect, useState } from 'react';
import { fetchBroadcastConfig } from '@/services/broadcast';

/**
 * Whether VALLAVAN TV is live (broadcast_config.channel_live). Module-cached so
 * the many Header instances share a single fetch. Returns null while loading.
 */
let cache: boolean | null = null;
let inflight: Promise<boolean> | null = null;

export function useChannelLive(): boolean | null {
  const [live, setLive] = useState<boolean | null>(cache);

  useEffect(() => {
    if (cache !== null) { setLive(cache); return; }
    if (!inflight) inflight = fetchBroadcastConfig().then((c) => { cache = !!c.channel_live; return cache; });
    let active = true;
    inflight.then((v) => { if (active) setLive(v); });
    return () => { active = false; };
  }, []);

  return live;
}
