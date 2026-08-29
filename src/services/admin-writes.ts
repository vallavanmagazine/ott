/**
 * Admin write operations — direct Supabase client mutations for the Admin CMS.
 * Every mutation appends an audit_logs row (actor email + action).
 *
 * Security: these only succeed for an authenticated admin (RLS `is_admin()`);
 * see supabase/rls_and_tables.sql. Until an admin is signed in (Phase 2) they
 * will be rejected by RLS — the UI surfaces the error.
 */
import { supabase } from '@/lib/supabase';
import { toEmbedUrl } from '@/lib/video';

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


/**
 * Provenance for a video asset, shared by every table carrying `video_url`
 * (documentaries, feed_reels, inspire_items, live_slots). Written by the Bunny
 * upload widget via form state; see supabase/bunny_video_fields.sql.
 */
export interface VideoSourceInput {
  thumbnailUrl?: string | null;
  videoProvider?: string | null;
  bunnyVideoId?: string | null;
}

/**
 * Copy the Bunny provenance fields onto a row payload.
 *
 * Each mapper below treats `undefined` as "leave this column alone", which is
 * what protects legacy rows: an editor that did not run an upload leaves all
 * three undefined, so saving an existing DyneTube/YouTube row never blanks its
 * thumbnail_url or rewrites its video_provider.
 */
function applyVideoSource(input: Partial<VideoSourceInput>, row: Record<string, unknown>): void {
  if (input.thumbnailUrl !== undefined) row.thumbnail_url = input.thumbnailUrl;
  if (input.videoProvider !== undefined) row.video_provider = input.videoProvider;
  if (input.bunnyVideoId !== undefined) row.bunny_video_id = input.bunnyVideoId;
}

// ===========================================================================
// SPONSORS (management)
// ===========================================================================
/** Suspend/activate a sponsor. Status is one of 'Active' | 'Suspended' | 'Pending'. */
export async function setSponsorStatus(id: string, status: string, name?: string): Promise<void> {
  const { error } = await client().from('sponsors').update({ status }).eq('id', id);
  if (error) throw error;
  await logAudit(`Sponsor ${name ?? id} → ${status}`);
}

// ===========================================================================
// DOCUMENTARIES
// ===========================================================================
export interface DocumentaryInput extends VideoSourceInput {
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
  if (input.videoUrl !== undefined) row.video_url = toEmbedUrl(input.videoUrl);
  if (input.status !== undefined) row.status = input.status;
  applyVideoSource(input, row);
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
export interface FeedReelInput extends VideoSourceInput {
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
  videoUrl?: string | null;
  /** campaigns.id — the DB stores an FK; the viewer shape shows the name. */
  attachedCampaignId?: string | null;
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
  if (input.videoUrl !== undefined) row.video_url = toEmbedUrl(input.videoUrl);
  if (input.attachedCampaignId !== undefined) row.attached_campaign = input.attachedCampaignId;
  applyVideoSource(input, row);
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

/** Inline Published/Draft switch from the feed list. */
export async function setFeedReelStatus(id: string, status: 'Published' | 'Draft' | 'Scheduled', title?: string) {
  const { error } = await client().from('feed_reels').update({ status }).eq('id', id);
  if (error) throw error;
  await logAudit(`Feed reel "${title ?? id}" → ${status}`);
}

/** Inline ad-placement flags (strip ad host / banner after) from the feed list. */
export async function setFeedReelAdFlags(
  id: string,
  flags: { stripAdHost?: boolean; bannerAfter?: boolean },
  title?: string,
) {
  const row: Record<string, unknown> = {};
  if (flags.stripAdHost !== undefined) row.strip_ad_host = flags.stripAdHost;
  if (flags.bannerAfter !== undefined) row.banner_after = flags.bannerAfter;
  const { error } = await client().from('feed_reels').update(row).eq('id', id);
  if (error) throw error;
  await logAudit(`Feed reel "${title ?? id}" ad flags updated`);
}

/**
 * Persist a new feed order. Callers pass the ids in their final display order;
 * sort_order becomes the array index. Runs the updates in parallel — the rows
 * are independent, so a partial failure only leaves that one row stale.
 */
export async function reorderFeedReels(orderedIds: string[]) {
  const db = client();
  const results = await Promise.all(
    orderedIds.map((id, index) => db.from('feed_reels').update({ sort_order: index }).eq('id', id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
  await logAudit(`Reordered feed (${orderedIds.length} items)`);
}

// ===========================================================================
// LIVE SLOTS
// ===========================================================================
export interface LiveSlotInput extends VideoSourceInput {
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
  airDate?: string;
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
  if (input.videoUrl !== undefined) row.video_url = toEmbedUrl(input.videoUrl);
  if (input.breakAfterSec !== undefined) row.break_after_sec = input.breakAfterSec;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.airDate !== undefined) row.air_date = input.airDate;
  applyVideoSource(input, row);
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
export interface InspireItemInput extends VideoSourceInput {
  title: string;
  titleTa: string;
  category: string;
  durationSec: number;
  poster: string;
  quote?: string | null;
  attribution?: string | null;
  badge?: string | null;
  videoUrl?: string | null;
  isSponsored?: boolean;
  sponsorId?: string | null;
  sponsorLogoUrl?: string | null;
  sortOrder?: number;
  status?: 'Published' | 'Draft';
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
  if (input.videoUrl !== undefined) row.video_url = toEmbedUrl(input.videoUrl);
  if (input.isSponsored !== undefined) row.is_sponsored = input.isSponsored;
  if (input.sponsorId !== undefined) row.sponsor_id = input.sponsorId;
  if (input.sponsorLogoUrl !== undefined) row.sponsor_logo_url = input.sponsorLogoUrl;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.status !== undefined) row.status = input.status;
  applyVideoSource(input, row);
  return row;
}

/** Inline Published/Draft switch from the Inspire list. */
export async function setInspireStatus(id: string, status: 'Published' | 'Draft', title?: string) {
  const { error } = await client().from('inspire_items').update({ status }).eq('id', id);
  if (error) throw error;
  await logAudit(`Inspire item "${title ?? id}" → ${status}`);
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

// ===========================================================================
// USERS — role changes
// ===========================================================================
export type UserRole = 'Viewer' | 'Sponsor' | 'Creator' | 'Admin';

export async function setUserRole(id: string, role: UserRole, name?: string) {
  const { error } = await client().from('app_users').update({ role }).eq('id', id);
  if (error) throw error;
  await logAudit(`User ${name ?? id} role → ${role}`);
}

// ===========================================================================
// SPONSORS — profile create / update
// ===========================================================================
export interface SponsorInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  ownerName?: string | null;
  businessType?: string | null;
  gstNumber?: string | null;
  district?: string | null;
  status?: string;
}

function sponsorToRow(input: Partial<SponsorInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.email !== undefined) row.email = input.email;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.ownerName !== undefined) row.owner_name = input.ownerName;
  if (input.businessType !== undefined) row.business_type = input.businessType;
  if (input.gstNumber !== undefined) row.gst_number = input.gstNumber;
  if (input.district !== undefined) row.district = input.district;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

export async function createSponsor(input: SponsorInput) {
  const { data, error } = await client()
    .from('sponsors')
    .insert({ status: 'Active', ...sponsorToRow(input) })
    .select()
    .single();
  if (error) throw error;
  await logAudit(`Created sponsor "${input.name}"`);
  return data;
}

export async function updateSponsor(id: string, input: Partial<SponsorInput>) {
  const { error } = await client().from('sponsors').update(sponsorToRow(input)).eq('id', id);
  if (error) throw error;
  await logAudit(`Updated sponsor "${input.name ?? id}"`);
}

// ===========================================================================
// CAMPAIGNS — lifecycle beyond approve/reject
// ===========================================================================
export type CampaignStatus = 'Draft' | 'Pending Approval' | 'Active' | 'Paused' | 'Ended';

export async function setCampaignStatus(id: string, status: CampaignStatus, name?: string) {
  const { error } = await client().from('campaigns').update({ status }).eq('id', id);
  if (error) throw error;
  await logAudit(`Campaign "${name ?? id}" → ${status}`);
}

// ===========================================================================
// AD CREATIVES
// ===========================================================================
export interface AdInput {
  sponsor: string;
  sponsorId?: string | null;
  sponsorLogo?: string;
  headline: string;
  body: string;
  cta: string;
  bgImage: string;
  accent: string;
  campaignId?: string | null;
}

function adToRow(input: Partial<AdInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.sponsor !== undefined) row.sponsor = input.sponsor;
  if (input.sponsorId !== undefined) row.sponsor_id = input.sponsorId;
  if (input.sponsorLogo !== undefined) row.sponsor_logo = input.sponsorLogo;
  if (input.headline !== undefined) row.headline = input.headline;
  if (input.body !== undefined) row.body = input.body;
  if (input.cta !== undefined) row.cta = input.cta;
  if (input.bgImage !== undefined) row.bg_image = input.bgImage;
  if (input.accent !== undefined) row.accent = input.accent;
  if (input.campaignId !== undefined) row.campaign_id = input.campaignId;
  return row;
}

export async function createAd(input: AdInput) {
  const { data, error } = await client().from('ads').insert(adToRow(input)).select().single();
  if (error) throw error;
  await logAudit(`Created ad creative "${input.headline}"`);
  return data;
}

export async function updateAd(id: string, input: Partial<AdInput>) {
  const { error } = await client().from('ads').update(adToRow(input)).eq('id', id);
  if (error) throw error;
  await logAudit(`Updated ad creative "${input.headline ?? id}"`);
}

export async function deleteAd(id: string, headline?: string) {
  const { error } = await client().from('ads').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted ad creative "${headline ?? id}"`);
}

/** Create the placement row that makes an ad eligible for a given slot. */
export async function createAdPlacement(input: {
  sponsor: string; adId: string; placement: string; status?: string;
}) {
  const { error } = await client().from('ad_placements').insert({
    sponsor: input.sponsor,
    ad_id: input.adId,
    placement: input.placement,
    status: input.status ?? 'Live',
  });
  if (error) throw error;
  await logAudit(`Created ad placement ${input.placement} for ${input.sponsor}`);
}

export async function deleteAdPlacement(id: string, placement?: string) {
  const { error } = await client().from('ad_placements').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted ad placement ${placement ?? id}`);
}
