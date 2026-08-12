/**
 * Notifications service — returns data shaped as notifications array in mockData.ts
 */
import { supabase } from '@/lib/supabase';
import { notifications as mockNotifications } from '@/data/mockData';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay} days ago`;
}

export async function fetchNotifications() {
  if (!supabase) return mockNotifications;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !data) return mockNotifications;

  return data.map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    titleTa: row.title_ta || undefined,
    body: row.body,
    time: timeAgo(row.created_at),
    unread: row.unread,
  }));
}
