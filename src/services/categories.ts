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
  sortOrder: number;
  isActive: boolean;
}

function rowTo(r: any): ContentCategory {
  return { id: r.id, section: r.section, name: r.name, displayName: r.display_name, sortOrder: r.sort_order ?? 0, isActive: r.is_active !== false };
}

/** Active category display-names for a section (for chips). Falls back to []. */
export async function fetchCategoryNames(section: CategorySection): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('content_categories').select('display_name, sort_order, is_active').eq('section', section).order('sort_order');
  return (data ?? []).filter((r: any) => r.is_active !== false).map((r: any) => r.display_name as string);
}

/** All categories (admin view — includes inactive). */
export async function fetchAllCategories(section: CategorySection): Promise<ContentCategory[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('content_categories').select('*').eq('section', section).order('sort_order');
  return (data ?? []).map(rowTo);
}

export async function addCategory(section: CategorySection, displayName: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const name = displayName.trim();
  if (!name) throw new Error('Name required');
  const { data: max } = await supabase.from('content_categories').select('sort_order').eq('section', section).order('sort_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (max?.sort_order ?? -1) + 1;
  const { error } = await supabase.from('content_categories').insert({ section, name, display_name: name, sort_order: nextOrder });
  if (error) throw error;
  await logAudit(`Added ${section} category "${name}"`);
}

export async function renameCategory(id: string, displayName: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('content_categories').update({ display_name: displayName.trim() }).eq('id', id);
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
