import type { Metadata } from 'next';
import { supabase, imageUrl, type InspireItem, APP_URL } from '../../../lib/supabase';

export const revalidate = 3600;

async function getItem(id: string): Promise<InspireItem | null> {
  const { data } = await supabase
    .from('inspire_items')
    .select('id, title, quote, attribution, poster, category, duration_sec, created_at')
    .eq('id', id).maybeSingle();
  return (data as InspireItem) ?? null;
}

/**
 * inspire_items has no description column — `quote` is the closest thing, and
 * it is nullable. Fall back to the category so a quoteless row still gets a
 * meaningful share preview rather than an empty one.
 */
function describe(item: InspireItem): string {
  const quote = (item.quote ?? '').trim();
  if (quote) return item.attribution ? `${quote} — ${item.attribution}` : quote;
  return `${item.category} · Vallavan`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const item = await getItem(params.id);
  if (!item) return { title: 'Not found' };
  const description = describe(item);
  const image = imageUrl(item.poster);
  return {
    title: item.title,
    description,
    openGraph: {
      title: item.title,
      description,
      images: image ? [{ url: image }] : undefined,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: item.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function iso8601Duration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `PT${m}M${s}S`;
}

export default async function InspirePage({ params }: { params: { id: string } }) {
  const item = await getItem(params.id);
  if (!item) return <main style={{ padding: 24 }}>Not found.</main>;

  const description = describe(item);
  const image = imageUrl(item.poster);

  // VideoObject JSON-LD — the core AEO lever for Google video + answer engines.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: item.title,
    description,
    thumbnailUrl: image ? [image] : undefined,
    uploadDate: item.created_at,
    duration: iso8601Duration(item.duration_sec),
    genre: item.category,
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {image && (
        <img src={image} alt={item.title} style={{ width: '100%', borderRadius: 16, aspectRatio: '16/7', objectFit: 'cover' }} />
      )}
      <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 16 }}>{item.title}</h1>
      <div style={{ color: '#A0A0A0' }}>{item.category}</div>
      <p style={{ lineHeight: 1.6, marginTop: 12 }}>{description}</p>
      {/* Homepage, not a deep link — the SPA still has no router. See documentaries/[id]. */}
      <a href={`${APP_URL}/`}
         style={{ display: 'inline-block', marginTop: 16, background: '#D32F2F', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
        ▶ Watch Now on Vallavan
      </a>
    </main>
  );
}
