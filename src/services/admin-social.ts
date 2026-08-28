/**
 * Social publishing queue.
 *
 * IMPORTANT: nothing here calls Meta, X or YouTube. Posts are composed and
 * queued in `social_posts`; the actual publish runs server-side (NestJS + Meta
 * Graph API) and is a separate, human-approved step. This module only ever
 * writes rows to our own database.
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';
import { formatDateShort } from '@/lib/transforms';

function client() {
  if (!supabase) throw new Error('Supabase is not configured (.env missing).');
  return supabase;
}

export type SocialContentType = 'feed' | 'documentary' | 'inspire';

export interface ContentOption {
  id: string;
  type: SocialContentType;
  title: string;
  titleTa: string;
  caption: string;
}

/** Publishable content across all three libraries, newest first. */
export async function fetchContentOptions(): Promise<ContentOption[]> {
  if (!supabase) return [];
  const [feed, docs, inspire] = await Promise.all([
    supabase.from('feed_reels').select('id, title, title_ta, caption').eq('status', 'Published').order('created_at', { ascending: false }).limit(50),
    supabase.from('documentaries').select('id, title, title_ta, synopsis').eq('status', 'Published').order('created_at', { ascending: false }).limit(50),
    supabase.from('inspire_items').select('id, title, title_ta, quote').order('created_at', { ascending: false }).limit(50),
  ]);

  return [
    ...(feed.data ?? []).map((r: any) => ({
      id: r.id, type: 'feed' as const, title: r.title, titleTa: r.title_ta ?? '', caption: r.caption ?? '',
    })),
    ...(docs.data ?? []).map((r: any) => ({
      id: r.id, type: 'documentary' as const, title: r.title, titleTa: r.title_ta ?? '', caption: r.synopsis ?? '',
    })),
    ...(inspire.data ?? []).map((r: any) => ({
      id: r.id, type: 'inspire' as const, title: r.title, titleTa: r.title_ta ?? '', caption: r.quote ?? '',
    })),
  ];
}

export interface SocialPostRow {
  id: string;
  contentType: string | null;
  contentId: string | null;
  caption: string;
  platforms: string[];
  embeddedAdId: string | null;
  embeddedAdHeadline: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  created: string;
}

export async function fetchSocialPosts(): Promise<SocialPostRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('social_posts')
    .select('*, ad:ads(headline)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as any[]).map((p) => ({
    id: p.id,
    contentType: p.content_type ?? null,
    contentId: p.content_id ?? null,
    caption: p.caption ?? '',
    platforms: p.platforms ?? [],
    embeddedAdId: p.embedded_ad_id ?? null,
    embeddedAdHeadline: p.ad?.headline ?? '',
    status: p.status ?? 'draft',
    scheduledAt: p.scheduled_at ? formatDateShort(p.scheduled_at) : null,
    postedAt: p.posted_at ? formatDateShort(p.posted_at) : null,
    created: p.created_at ? formatDateShort(p.created_at) : '—',
  }));
}

export interface SocialPostInput {
  contentType?: string | null;
  contentId?: string | null;
  caption: string;
  platforms: string[];
  embeddedAdId?: string | null;
  status: string;
  scheduledAt?: string | null;
}

function postToRow(input: Partial<SocialPostInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.contentType !== undefined) row.content_type = input.contentType;
  if (input.contentId !== undefined) row.content_id = input.contentId;
  if (input.caption !== undefined) row.caption = input.caption;
  if (input.platforms !== undefined) row.platforms = input.platforms;
  if (input.embeddedAdId !== undefined) row.embedded_ad_id = input.embeddedAdId;
  if (input.status !== undefined) row.status = input.status;
  if (input.scheduledAt !== undefined) row.scheduled_at = input.scheduledAt;
  return row;
}

export async function createSocialPost(input: SocialPostInput) {
  const { error } = await client().from('social_posts').insert(postToRow(input));
  if (error) throw error;
  await logAudit(`Queued social post (${input.status}) for ${input.platforms.join(', ')}`);
}

export async function updateSocialPost(id: string, input: Partial<SocialPostInput>) {
  const { error } = await client().from('social_posts').update(postToRow(input)).eq('id', id);
  if (error) throw error;
  await logAudit(`Updated social post ${id}`);
}

export async function deleteSocialPost(id: string) {
  const { error } = await client().from('social_posts').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted social post ${id}`);
}

/** Ad creatives belonging to campaigns that are currently Active. */
export async function fetchActiveCampaignAds(): Promise<{ id: string; headline: string; sponsor: string }[]> {
  if (!supabase) return [];
  const { data: campaigns } = await supabase.from('campaigns').select('id').eq('status', 'Active');
  const ids = (campaigns ?? []).map((c: any) => c.id);
  if (ids.length === 0) return [];
  const { data } = await supabase.from('ads').select('id, headline, sponsor').in('campaign_id', ids);
  return (data ?? []).map((a: any) => ({ id: a.id, headline: a.headline, sponsor: a.sponsor }));
}

/** Default caption: bilingual title, the blurb, then hashtags. */
export function buildCaption(content: ContentOption, sponsor?: string): string {
  const parts = [content.title];
  if (content.titleTa) parts.push(content.titleTa);
  if (content.caption) parts.push('', content.caption.slice(0, 180));
  if (sponsor) parts.push('', `Presented by ${sponsor}`);
  parts.push('', '#Vallavan #TamilDocumentary #வல்லவன்');
  return parts.join('\n');
}

export interface GenerateResult {
  created: number;
  skipped: number;
}

/**
 * Draft one post per recent published item, pairing each with a rotating
 * active-campaign creative. Drafts only — an admin reviews before anything is
 * scheduled or published.
 */
export async function generateTodaysPosts(platforms: string[]): Promise<GenerateResult> {
  const [content, ads] = await Promise.all([fetchContentOptions(), fetchActiveCampaignAds()]);
  const existing = await fetchSocialPosts();
  const alreadyQueued = new Set(existing.filter((p) => p.status === 'draft').map((p) => p.contentId));

  const candidates = content.slice(0, 5).filter((c) => !alreadyQueued.has(c.id));
  if (candidates.length === 0) return { created: 0, skipped: content.slice(0, 5).length };

  let index = 0;
  for (const item of candidates) {
    const ad = ads.length > 0 ? ads[index % ads.length] : undefined;
    await createSocialPost({
      contentType: item.type,
      contentId: item.id,
      caption: buildCaption(item, ad?.sponsor),
      platforms,
      embeddedAdId: ad?.id ?? null,
      status: 'draft',
    });
    index++;
  }

  await logAudit(`Auto-generated ${candidates.length} social post drafts`);
  return { created: candidates.length, skipped: content.slice(0, 5).length - candidates.length };
}
