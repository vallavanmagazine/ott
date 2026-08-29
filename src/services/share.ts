/**
 * Share links for content (documentaries, reels, inspire items, live slots).
 *
 * Deliberately mirrors payments.ts shareLinks() rather than introducing a
 * second share mechanism: same wa.me / sms: / mailto: shapes, same
 * encodeURIComponent handling. The difference is what is shared — a public
 * seo-site URL instead of a Razorpay payment link.
 *
 * Shared URLs point at seo-site (vallavan.in), NOT the SPA (app.vallavan.in).
 * That is the whole point: seo-site server-renders per-item OpenGraph tags, so
 * a pasted link shows a real title, description and thumbnail. The SPA is a
 * client-rendered bundle whose meta tags are identical on every route, so a
 * link to it would preview as the generic homepage.
 */

/** Public site base. Overridable at build time; defaults to the live domain. */
export const SITE_URL: string =
  ((import.meta.env.VITE_SITE_URL as string | undefined) || 'https://vallavan.in').replace(/\/$/, '');

/**
 * Content kinds and the seo-site route each one maps to.
 *
 * 'reel' and 'live' are the app's real navigation (Feed and Live TV) and use
 * slugs. 'documentary' and 'inspire' are legacy id-based routes kept working
 * for links already in the wild; they are not being extended.
 */
export type ShareKind = 'documentary' | 'reel' | 'inspire' | 'live';

const ROUTES: Record<ShareKind, string> = {
  documentary: 'documentaries',
  reel: 'feed',
  inspire: 'inspire',
  live: 'live',
};

/**
 * Canonical public URL for a piece of content.
 *
 * `ref` is the slug where one exists and the id otherwise — the seo-site routes
 * resolve slug first and fall back to id, so a row that predates
 * supabase/feed_live_slugs.sql still shares a working link.
 */
export function shareUrl(kind: ShareKind, ref: string): string {
  return `${SITE_URL}/${ROUTES[kind]}/${ref}`;
}

/** The slug when present, else the id. Use this to build `ref`. */
export function shareRef(item: { slug?: string | null; id: string }): string {
  return (item.slug ?? '').trim() || item.id;
}

/** WhatsApp / SMS / email deep-links — same shape as payments.ts shareLinks(). */
export function contentShareLinks(url: string, title: string) {
  const msg = `${title} — watch on Vallavan: ${url}`;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(msg)}`,
    sms: `sms:?body=${encodeURIComponent(msg)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(msg)}`,
  };
}

export type ShareOutcome = 'shared' | 'dismissed' | 'unsupported';

/**
 * Try the OS share sheet.
 *
 * Returns 'unsupported' when the browser has no Web Share API (every desktop
 * browser except Safari, and any non-secure context) so the caller can open
 * the WhatsApp/SMS/email fallback instead. A user who opens the sheet and
 * cancels raises AbortError — that is 'dismissed', not a failure, and must not
 * surface an error toast.
 */
export async function nativeShare(title: string, url: string): Promise<ShareOutcome> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return 'unsupported';
  try {
    await navigator.share({ title, text: title, url });
    return 'shared';
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return 'dismissed';
    // Any other failure (permission, unsupported payload) falls back to the menu.
    return 'unsupported';
  }
}
