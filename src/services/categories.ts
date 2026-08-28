/**
 * Admin-managed content categories (FIX 4). Chips for Explore/Inspire/Feed read
 * from content_categories; admins add/rename/reorder/hide from the dashboard.
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

export type CategorySection = 'explore' | 'inspire' | 'feed';

export interface ContentCategory {
  id: string;
  section: CategorySection;
  name: string;
  displayName: string;
  displayNameTa: string;
  sortOrder: number;
  isActive: boolean;
  contentCount?: number;
}

function rowTo(r: any): ContentCategory {
  return { id: r.id, section: r.section, name: r.name, displayName: r.display_name, displayNameTa: r.display_name_ta ?? '', sortOrder: r.sort_order ?? 0, isActive: r.is_active !== false };
}

/** Count published content per category name for a section. */
async function fetchContentCounts(section: CategorySection): Promise<Record<string, number>> {
  if (!supabase) return {};
  const counts: Record<string, number> = {};
  try {
    if (section === 'explore') {
      const { data } = await supabase.from('documentaries').select('genre');
      (data ?? []).forEach((r: any) => { counts[r.genre] = (counts[r.genre] ?? 0) + 1; });
    } else if (section === 'inspire') {
      const { data } = await supabase.from('inspire_items').select('category');
      (data ?? []).forEach((r: any) => { counts[r.category] = (counts[r.category] ?? 0) + 1; });
    } else {
      const { data } = await supabase.from('feed_reels').select('content_type');
      (data ?? []).forEach((r: any) => { counts[r.content_type] = (counts[r.content_type] ?? 0) + 1; });
    }
  } catch { /* ignore */ }
  return counts;
}

/** Active category display-names for a section (for chips). Falls back to []. */
export async function fetchCategoryNames(section: CategorySection): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('content_categories').select('display_name, sort_order, is_active').eq('section', section).order('sort_order');
  return (data ?? []).filter((r: any) => r.is_active !== false).map((r: any) => r.display_name as string);
}

/** All categories for a section (admin view — includes inactive + content counts). */
export async function fetchAllCategories(section: CategorySection): Promise<ContentCategory[]> {
  if (!supabase) return [];
  const [{ data }, counts] = await Promise.all([
    supabase.from('content_categories').select('*').eq('section', section).order('sort_order'),
    fetchContentCounts(section),
  ]);
  return (data ?? []).map(rowTo).map((c) => ({ ...c, contentCount: counts[c.name] ?? 0 }));
}

export async function addCategory(section: CategorySection, displayName: string, displayNameTa = ''): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const name = displayName.trim();
  if (!name) throw new Error('Name required');
  const { data: max } = await supabase.from('content_categories').select('sort_order').eq('section', section).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (max?.sort_order ?? -1) + 1;
  const { error } = await supabase.from('content_categories').insert({ section, name, display_name: name, display_name_ta: displayNameTa.trim() || null, sort_order: nextOrder });
  if (error) throw error;
  await logAudit(`Added ${section} category "${name}"`);
}

export async function renameCategory(id: string, displayName: string, displayNameTa?: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const patch: Record<string, unknown> = { display_name: displayName.trim() };
  if (displayNameTa !== undefined) patch.display_name_ta = displayNameTa.trim() || null;
  const { error } = await supabase.from('content_categories').update(patch).eq('id', id);
  if (error) throw error;
  await logAudit(`Renamed category → "${displayName}"`);
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('content_categories').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
  await logAudit(`${isActive ? 'Enabled' : 'Hid'} category ${id}`);
}

export async function moveCategory(id: string, sortOrder: number): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('content_categories').update({ sort_order: sortOrder }).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('content_categories').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted category ${id}`);
}

/**
 * Persist a whole section's order. Callers pass ids in final display order and
 * sort_order becomes the array index.
 *
 * Swapping the two rows' sort_order values (the obvious approach) silently does
 * nothing when both rows share a value — which is the case for any section
 * seeded before sort_order was populated. Writing absolute indices always works.
 */
export async function reorderCategories(orderedIds: string[]): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const db = supabase;
  const results = await Promise.all(
    orderedIds.map((id, index) => db.from('content_categories').update({ sort_order: index }).eq('id', id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  await logAudit(`Reordered categories (${orderedIds.length} items)`);
}
