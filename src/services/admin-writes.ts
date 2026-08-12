/**
 * Admin write operations — direct Supabase client mutations for the Admin CMS.
 * Every mutation appends an audit_logs row (actor email + action).
 *
 * Security: these only succeed for an authenticated admin (RLS `is_admin()`);
 * see supabase/rls_and_tables.sql. Until an admin is signed in (Phase 2) they
 * will be rejected by RLS — the UI surfaces the error.
 */
import { supabase } from '@/lib/supabase';

function client() {
  if (!supabase) throw new Error('Supabase is not configured (.env missing).');
  return supabase;
}

/** Current admin's email for audit attribution (falls back before Phase 2 auth). */
export async function actorEmail(): Promise<string> {
  if (!supabase) return 'admin@vallavan.in';
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? 'admin@vallavan.in';
}

/** Append an audit_logs row. Never throws (best-effort logging). */
export async function logAudit(action: string): Promise<void> {
  if (!supabase) return;
  try {
    const actor = await actorEmail();
    await supabase.from('audit_logs').insert({ actor, action });
  } catch (e) {
    console.warn('audit log failed:', e);
  }
}

// ===========================================================================
// DOCUMENTARIES
// ===========================================================================
export interface DocumentaryInput {
  title: string;
  titleTa: string;
  genre: string;
  durationSec: number;
  poster: string;
  backdrop: string;
  year: number;
  language: string;
  synopsis: string;
  synopsisTa: string;
  badge?: string | null;
  exclusive?: boolean;
  director?: string | null;
  cast?: string[] | null;
  videoUrl?: string | null;
  status?: 'Published' | 'Draft';
}

function docToRow(input: Partial<DocumentaryInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.titleTa !== undefined) row.title_ta = input.titleTa;
  if (input.genre !== undefined) row.genre = input.genre;
  if (input.durationSec !== undefined) row.duration_sec = input.durationSec;
  if (input.poster !== undefined) row.poster = input.poster;
  if (input.backdrop !== undefined) row.backdrop = input.backdrop;
  if (input.year !== undefined) row.year = input.year;
  if (input.language !== undefined) row.language = input.language;
  if (input.synopsis !== undefined) row.synopsis = input.synopsis;
  if (input.synopsisTa !== undefined) row.synopsis_ta = input.synopsisTa;
  if (input.badge !== undefined) row.badge = input.badge;
  if (input.exclusive !== undefined) row.exclusive = input.exclusive;
  if (input.director !== undefined) row.director = input.director;
  if (input.cast !== undefined) row.cast = input.cast;
  if (input.videoUrl !== undefined) row.video_url = input.videoUrl;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

export async function createDocumentary(input: DocumentaryInput) {
  const { data, error } = await client()
    .from('documentaries')
    .insert({ status: 'Draft', ...docToRow(input) })
    .select()
    .single();
  if (error) throw error;
  await logAudit(`Created documentary "${input.title}"`);
  return data;
}

export async function updateDocumentary(id: string, input: Partial<DocumentaryInput>) {
  const { data, error } = await client()
    .from('documentaries')
    .update(docToRow(input))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  await logAudit(`Updated documentary "${input.title ?? id}"`);
  return data;
}

export async function deleteDocumentary(id: string, title?: string) {
  const { error } = await client().from('documentaries').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted documentary "${title ?? id}"`);
}

export async function publishDocumentary(id: string, title?: string) {
  const { error } = await client().from('documentaries').update({ status: 'Published' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Published "${title ?? id}"`);
}

export async function unpublishDocumentary(id: string, title?: string) {
  const { error } = await client().from('documentaries').update({ status: 'Draft' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Unpublished "${title ?? id}"`);
}

// ===========================================================================
// FEED REELS
// ===========================================================================
export interface FeedReelInput {
  title: string;
  titleTa: string;
  caption: string;
  captionTa?: string;
  creator?: string;
  creatorHandle?: string;
  contentType: string;
  genre: string;
  durationSec?: number;
  thumb: string;
  status?: 'Published' | 'Draft' | 'Scheduled';
  stripAdHost?: boolean;
  bannerAfter?: boolean;
  sortOrder?: number;
}

function reelToRow(input: Partial<FeedReelInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.titleTa !== undefined) row.title_ta = input.titleTa;
  if (input.caption !== undefined) row.caption = input.caption;
  if (input.captionTa !== undefined) row.caption_ta = input.captionTa;
  if (input.creator !== undefined) row.creator = input.creator;
  if (input.creatorHandle !== undefined) row.creator_handle = input.creatorHandle;
  if (input.contentType !== undefined) row.content_type = input.contentType;
  if (input.genre !== undefined) row.genre = input.genre;
  if (input.durationSec !== undefined) row.duration_sec = input.durationSec;
  if (input.thumb !== undefined) row.thumb = input.thumb;
  if (input.status !== undefined) row.status = input.status;
  if (input.stripAdHost !== undefined) row.strip_ad_host = input.stripAdHost;
  if (input.bannerAfter !== undefined) row.banner_after = input.bannerAfter;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
}

export async function createFeedReel(input: FeedReelInput) {
  const { data, error } = await client()
    .from('feed_reels')
    .insert({
      caption_ta: '',
      creator: 'Vallavan News',
      creator_handle: '@vallavannews',
      duration_sec: 30,
      status: 'Draft',
      ...reelToRow(input),
    })
    .select()
    .single();
  if (error) throw error;
  await logAudit(`Created feed reel "${input.title}"`);
  return data;
}

export async function updateFeedReel(id: string, input: Partial<FeedReelInput>) {
  const { data, error } = await client().from('feed_reels').update(reelToRow(input)).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(`Updated feed reel "${input.title ?? id}"`);
  return data;
}

export async function deleteFeedReel(id: string, title?: string) {
  const { error } = await client().from('feed_reels').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted feed reel "${title ?? id}"`);
}

// ===========================================================================
// LIVE SLOTS
// ===========================================================================
export interface LiveSlotInput {
  title: string;
  titleTa: string;
  description: string;
  thumb: string;
  startTime24: string;
  durationMin: number;
  isLive?: boolean;
  videoUrl?: string | null;
  breakAfterSec?: number;
  sortOrder?: number;
}

function slotToRow(input: Partial<LiveSlotInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.titleTa !== undefined) row.title_ta = input.titleTa;
  if (input.description !== undefined) row.description = input.description;
  if (input.thumb !== undefined) row.thumb = input.thumb;
  if (input.startTime24 !== undefined) row.start_time24 = input.startTime24;
  if (input.durationMin !== undefined) row.duration_min = input.durationMin;
  if (input.isLive !== undefined) row.is_live = input.isLive;
  if (input.videoUrl !== undefined) row.video_url = input.videoUrl;
  if (input.breakAfterSec !== undefined) row.break_after_sec = input.breakAfterSec;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  return row;
}

export async function createLiveSlot(input: LiveSlotInput) {
  const { data, error } = await client().from('live_slots').insert(slotToRow(input)).select().single();
  if (error) throw error;
  await logAudit(`Added live slot "${input.title}"`);
  return data;
}

export async function updateLiveSlot(id: string, input: Partial<LiveSlotInput>) {
  const { data, error } = await client().from('live_slots').update(slotToRow(input)).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(`Updated live slot "${input.title ?? id}"`);
  return data;
}

export async function deleteLiveSlot(id: string, title?: string) {
  const { error } = await client().from('live_slots').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted live slot "${title ?? id}"`);
}

// ===========================================================================
// INSPIRE ITEMS
// ===========================================================================
export interface InspireItemInput {
  title: string;
  titleTa: string;
  category: string;
  durationSec: number;
  poster: string;
  quote?: string | null;
  attribution?: string | null;
  badge?: string | null;
}

function inspireToRow(input: Partial<InspireItemInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.titleTa !== undefined) row.title_ta = input.titleTa;
  if (input.category !== undefined) row.category = input.category;
  if (input.durationSec !== undefined) row.duration_sec = input.durationSec;
  if (input.poster !== undefined) row.poster = input.poster;
  if (input.quote !== undefined) row.quote = input.quote;
  if (input.attribution !== undefined) row.attribution = input.attribution;
  if (input.badge !== undefined) row.badge = input.badge;
  return row;
}

export async function createInspireItem(input: InspireItemInput) {
  const { data, error } = await client().from('inspire_items').insert(inspireToRow(input)).select().single();
  if (error) throw error;
  await logAudit(`Created inspire item "${input.title}"`);
  return data;
}

export async function updateInspireItem(id: string, input: Partial<InspireItemInput>) {
  const { data, error } = await client().from('inspire_items').update(inspireToRow(input)).eq('id', id).select().single();
  if (error) throw error;
  await logAudit(`Updated inspire item "${input.title ?? id}"`);
  return data;
}

export async function deleteInspireItem(id: string, title?: string) {
  const { error } = await client().from('inspire_items').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted inspire item "${title ?? id}"`);
}

// ===========================================================================
// USERS — suspend / activate
// ===========================================================================
export async function suspendUser(id: string, name?: string) {
  const { error } = await client().from('app_users').update({ status: 'Suspended' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Suspended user ${name ?? id}`);
}

export async function activateUser(id: string, name?: string) {
  const { error } = await client().from('app_users').update({ status: 'Active' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Activated user ${name ?? id}`);
}

// ===========================================================================
// CAMPAIGNS — approve / reject
// ===========================================================================
export async function approveCampaign(id: string, name?: string) {
  const { error } = await client().from('campaigns').update({ status: 'Active' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Approved campaign "${name ?? id}"`);
}

export async function rejectCampaign(id: string, name?: string) {
  const { error } = await client().from('campaigns').update({ status: 'Ended' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Rejected campaign "${name ?? id}"`);
}

// ===========================================================================
// AD PLACEMENTS — pause / resume
// ===========================================================================
export async function pauseAdPlacement(id: string, placement?: string) {
  const { error } = await client().from('ad_placements').update({ status: 'Paused' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Paused ad placement ${placement ?? id}`);
}

export async function resumeAdPlacement(id: string, placement?: string) {
  const { error } = await client().from('ad_placements').update({ status: 'Live' }).eq('id', id);
  if (error) throw error;
  await logAudit(`Resumed ad placement ${placement ?? id}`);
}
