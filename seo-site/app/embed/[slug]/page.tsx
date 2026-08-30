import type { Metadata } from 'next';
import { supabase, imageUrl, isUuid, type Reel, SITE_URL } from '../../../lib/supabase';

export const revalidate = 3600;

// '*' rather than a column list, for the same reason as app/feed/[slug]: naming
// `slug` before that migration has run makes PostgREST reject the query.
const COLUMNS = '*';

/**
 * Embeddable card for one reel — the thing another site puts in an <iframe>.
 *
 * Deliberately NOT a player. It is a poster, a title, the Vallavan mark and a
 * click-through to the real page, which is the same shape YouTube's embed falls
 * back to when playback is unavailable. Keeping it static means no video
 * bandwidth is spent on a host we do not control, no autoplay policy to fight,
 * and no third-party site can silently stream our content while stripping the
 * branding — the click has to come home to vallavan.in to actually watch.
 *
 * Renders at whatever size the host iframe gives it: the card fills 100% of the
 * viewport, so a 16:9 iframe gets a 16:9 card.
 *
 * Suggested snippet for a publisher:
 *   <iframe src="https://vallavan.in/embed/<slug>" width="560" height="315"
 *           style="border:0" loading="lazy" title="Vallavan"></iframe>
 *
 * NOTE: this only renders off-site if the origin stops sending
 * X-Frame-Options: SAMEORIGIN for /embed/. See nginx/vallavan.conf.
 */
async function getReel(slugOrId: string): Promise<Reel | null> {
  const bySlug = await supabase
    .from('feed_reels').select(COLUMNS).eq('slug', slugOrId).maybeSingle();
  if (bySlug.data) return bySlug.data as Reel;

  if (!isUuid(slugOrId)) return null;
  const byId = await supabase
    .from('feed_reels').select(COLUMNS).eq('id', slugOrId).maybeSingle();
  return (byId.data as Reel) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const reel = await getReel(params.slug);
  return {
    // `absolute` bypasses the root layout's "%s · Vallavan" template, which
    // would otherwise render "tsunami — Vallavan · Vallavan".
    title: { absolute: reel ? `${reel.title} — Vallavan` : 'Vallavan' },
    // The canonical share page is app/feed/[slug]; this one must not compete
    // with it in search results, it exists to be framed.
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({ params }: { params: { slug: string } }) {
  const reel = await getReel(params.slug);
  const watchUrl = `${SITE_URL}/feed/${params.slug}`;

  if (!reel) {
    return (
      <a href={SITE_URL} target="_blank" rel="noopener noreferrer" style={S.missing}>
        <img src="/icons/vallavanicon.webp" alt="" width={40} height={40} style={S.missingIcon} />
        <span>Watch documentaries on Vallavan</span>
      </a>
    );
  }

  const image = imageUrl(reel.thumb, 1280);

  return (
    // target="_blank" with _parent semantics: a framed link must escape the
    // iframe or the host page would render our whole site inside the card.
    <a href={watchUrl} target="_blank" rel="noopener noreferrer" style={S.card} title={`Watch "${reel.title}" on Vallavan`}>
      {image
        ? <img src={image} alt={reel.title} style={S.thumb} />
        : <div style={{ ...S.thumb, background: '#161616' }} />}

      {/* Legibility for the title over an arbitrary photograph. */}
      <div style={S.scrim} />

      <div style={S.playWrap}>
        <div style={S.playButton}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      <div style={S.footer}>
        <img src="/icons/vallavanicon.webp" alt="Vallavan" width={28} height={28} style={S.icon} />
        <div style={S.textCol}>
          <div style={S.title}>{reel.title}</div>
          <div style={S.brand}>Watch on Vallavan</div>
        </div>
      </div>
    </a>
  );
}

const S: Record<string, React.CSSProperties> = {
  card: {
    position: 'absolute', inset: 0, display: 'block', overflow: 'hidden',
    background: '#0A0A0A', textDecoration: 'none', color: '#fff',
  },
  thumb: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  scrim: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.35) 100%)',
  },
  playWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 64, height: 64, borderRadius: '50%', background: 'rgba(211,47,47,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 24px rgba(0,0,0,0.45)', paddingLeft: 4,
  },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
  },
  icon: { borderRadius: '50%', flexShrink: 0, objectFit: 'cover' },
  textCol: { minWidth: 0 },
  title: {
    fontSize: 15, fontWeight: 800, lineHeight: 1.25,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  brand: { fontSize: 11, color: '#D0D0D0', marginTop: 2 },
  missing: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, background: '#0A0A0A', color: '#fff', textDecoration: 'none',
    fontSize: 14, fontWeight: 700,
  },
  missingIcon: { borderRadius: '50%' },
};
