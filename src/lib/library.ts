/**
 * Local viewer library — Watch History + Watch Later, persisted in
 * localStorage (viewers stay local per BLOCKERS B3). Stores lightweight
 * Documentary snapshots so the list screens can render ContentCards offline.
 */
import type { Documentary } from '@/data/mockData';

const HIST = 'vallavan_watch_history';
const LATER = 'vallavan_watch_later';
const LIKED = 'vallavan_liked_reels';

function read(key: string): Documentary[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function write(key: string, arr: Documentary[]) {
  try { localStorage.setItem(key, JSON.stringify(arr)); } catch { /* quota / private mode */ }
}

// --- Watch History ---
export function getWatchHistory(): Documentary[] { return read(HIST); }

export function addToHistory(doc: Documentary) {
  if (!doc?.id) return;
  const list = read(HIST).filter((d) => d.id !== doc.id);
  list.unshift(doc);
  write(HIST, list.slice(0, 50));
}

export function clearHistory() { write(HIST, []); }

// --- Watch Later ---
export function getWatchLater(): Documentary[] { return read(LATER); }

export function isWatchLater(id: string): boolean {
  return read(LATER).some((d) => d.id === id);
}

/** Toggle an item; returns the new saved state (true = now saved). */
export function toggleWatchLater(doc: Documentary): boolean {
  const list = read(LATER);
  const exists = list.some((d) => d.id === doc.id);
  write(LATER, exists ? list.filter((d) => d.id !== doc.id) : [doc, ...list]);
  return !exists;
}

// --- Liked reels ---
// Ids only, not snapshots: the like lives on the feed_reels row (see
// supabase/feed_metrics_rpc.sql). This is just the per-viewer memory of which
// ones this browser already counted, so a reload cannot double-count a like.
export function getLikedReels(): string[] {
  try { return JSON.parse(localStorage.getItem(LIKED) || '[]'); } catch { return []; }
}

export function setReelLiked(id: string, liked: boolean): void {
  const next = getLikedReels().filter((x) => x !== id);
  if (liked) next.unshift(id);
  try { localStorage.setItem(LIKED, JSON.stringify(next.slice(0, 500))); } catch { /* quota / private mode */ }
}
