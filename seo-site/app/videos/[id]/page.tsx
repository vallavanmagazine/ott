import type { Metadata } from 'next';
import { supabase, imageUrl, type Reel, APP_URL } from '../../../lib/supabase';

export const revalidate = 3600;

async function getReel(id: string): Promise<Reel | null> {
  const { data } = await supabase
    .from('feed_reels')
    .select('id, title, caption, thumb, creator, genre, duration_sec, created_at')
    .eq('id', id).maybeSingle();
  return (data as Reel) ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const reel = await getReel(params.id);
  if (!reel) return { title: 'Not found' };
  // feed_reels has no synopsis; `caption` is the human-written blurb.
  const image = imageUrl(reel.thumb);
  return {
    title: reel.title,
    description: reel.caption,
    openGraph: {
      title: reel.title,
      description: reel.caption,
      images: image ? [{ url: image }] : undefined,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: reel.title,
      description: reel.caption,
      images: image ? [image] : undefined,
    },
  };
}

function iso8601Duration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `PT${m}M${s}S`;
}

export default async function ReelPage({ params }: { params: { id: string } }) {
  const reel = await getReel(params.id);
  if (!reel) return <main style={{ padding: 24 }}>Not found.</main>;

  const image = imageUrl(reel.thumb);

  // VideoObject JSON-LD — the core AEO lever for Google video + answer engines.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: reel.title,
    description: reel.caption,
    thumbnailUrl: image ? [image] : undefined,
    // Reels have no `year` column; created_at is the real publication date.
    uploadDate: reel.created_at,
    duration: iso8601Duration(reel.duration_sec),
    genre: reel.genre,
    creator: reel.creator ? { '@type': 'Person', name: reel.creator } : undefined,
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {image && (
        <img src={image} alt={reel.title} style={{ width: '100%', borderRadius: 16, aspectRatio: '16/7', objectFit: 'cover' }} />
      )}
      <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 16 }}>{reel.title}</h1>
      <div style={{ color: '#A0A0A0' }}>{reel.genre} · {reel.creator}</div>
      <p style={{ lineHeight: 1.6, marginTop: 12 }}>{reel.caption}</p>
      {/* Homepage, not a deep link — the SPA still has no router. See documentaries/[id]. */}
      <a href={`${APP_URL}/`}
         style={{ display: 'inline-block', marginTop: 16, background: '#D32F2F', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
        ▶ Watch Now on Vallavan
      </a>
    </main>
  );
}
