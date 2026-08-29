import type { Metadata } from 'next';
import { supabase, imageUrl, isUuid, type LiveSlot, APP_URL } from '../../../lib/supabase';

export const revalidate = 3600;

// '*' rather than a column list — see app/feed/[slug]/page.tsx.
const COLUMNS = '*';

/** Slug first, id fallback — see the note in app/feed/[slug]/page.tsx. */
async function getSlot(slugOrId: string): Promise<LiveSlot | null> {
  const bySlug = await supabase
    .from('live_slots').select(COLUMNS).eq('slug', slugOrId).maybeSingle();
  if (bySlug.data) return bySlug.data as LiveSlot;
  // bySlug.error means the slug column does not exist yet — fall through.

  if (!isUuid(slugOrId)) return null;
  const byId = await supabase
    .from('live_slots').select(COLUMNS).eq('id', slugOrId).maybeSingle();
  return (byId.data as LiveSlot) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slot = await getSlot(params.slug);
  if (!slot) return { title: 'Not found' };
  const image = imageUrl(slot.thumb);
  return {
    title: slot.title,
    description: slot.description,
    openGraph: {
      title: slot.title,
      description: slot.description,
      images: image ? [{ url: image }] : undefined,
      type: 'video.other',
    },
    twitter: {
      card: 'summary_large_image',
      title: slot.title,
      description: slot.description,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * live_slots stores duration in MINUTES, unlike every other content table
 * (duration_sec). Converting here rather than reusing the shared seconds
 * helper is the whole reason this page has its own.
 */
function iso8601FromMinutes(min: number) {
  return `PT${Math.max(0, Math.floor(min))}M`;
}

export default async function LiveSlotPage({ params }: { params: { slug: string } }) {
  const slot = await getSlot(params.slug);
  if (!slot) return <main style={{ padding: 24 }}>Not found.</main>;

  const image = imageUrl(slot.thumb);

  // VideoObject JSON-LD — the core AEO lever for Google video + answer engines.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: slot.title,
    description: slot.description,
    thumbnailUrl: image ? [image] : undefined,
    // air_date is a DATE column; it is the closest thing to a publish date.
    uploadDate: slot.air_date,
    duration: iso8601FromMinutes(slot.duration_min),
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {image && (
        <img src={image} alt={slot.title} style={{ width: '100%', borderRadius: 16, aspectRatio: '16/7', objectFit: 'cover' }} />
      )}
      <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 16 }}>{slot.title}</h1>
      <div style={{ color: '#A0A0A0' }}>{slot.start_time24} · {slot.duration_min} min</div>
      <p style={{ lineHeight: 1.6, marginTop: 12 }}>{slot.description}</p>
      {/* Homepage, not a deep link — the SPA still has no router. See documentaries/[id]. */}
      <a href={`${APP_URL}/`}
         style={{ display: 'inline-block', marginTop: 16, background: '#D32F2F', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
        ▶ Watch Now on Vallavan
      </a>
    </main>
  );
}
