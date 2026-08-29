import type { Metadata } from 'next';
import { supabase, type Doc, APP_URL } from '../../../lib/supabase';

export const revalidate = 3600;

async function getDoc(id: string): Promise<Doc | null> {
  const { data } = await supabase
    .from('documentaries')
    .select('id, title, synopsis, genre, poster, backdrop, year, duration_sec, language')
    .eq('id', id).maybeSingle();
  return (data as Doc) ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const doc = await getDoc(params.id);
  if (!doc) return { title: 'Not found' };
  return {
    title: doc.title,
    description: doc.synopsis,
    openGraph: {
      title: doc.title,
      description: doc.synopsis,
      images: [{ url: doc.backdrop }],
      type: 'video.other',
    },
    twitter: { card: 'summary_large_image', title: doc.title, description: doc.synopsis, images: [doc.backdrop] },
  };
}

function iso8601Duration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `PT${m}M${s}S`;
}

export default async function DocumentaryPage({ params }: { params: { id: string } }) {
  const doc = await getDoc(params.id);
  if (!doc) return <main style={{ padding: 24 }}>Not found.</main>;

  // VideoObject JSON-LD — the core AEO lever for Google video + answer engines.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: doc.title,
    description: doc.synopsis,
    thumbnailUrl: [doc.poster, doc.backdrop],
    uploadDate: `${doc.year}-01-01`,
    duration: iso8601Duration(doc.duration_sec),
    inLanguage: doc.language,
    genre: doc.genre,
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <img src={doc.backdrop} alt={doc.title} style={{ width: '100%', borderRadius: 16, aspectRatio: '16/7', objectFit: 'cover' }} />
      <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 16 }}>{doc.title}</h1>
      <div style={{ color: '#A0A0A0' }}>{doc.genre} · {doc.year} · {doc.language}</div>
      <p style={{ lineHeight: 1.6, marginTop: 12 }}>{doc.synopsis}</p>
      {/*
        Links to the app's homepage, not a per-video route. The SPA has no
        router — navigation is React state (App.tsx Overlay), and the only URL
        it reads is the `#admin` hash — so the previous
        `${APP_URL}/#/documentary/${doc.id}` was a dead link that silently
        dropped the visitor on the default feed. Restore the deep link once the
        SPA has real routing.
      */}
      <a href={`${APP_URL}/`}
         style={{ display: 'inline-block', marginTop: 16, background: '#D32F2F', color: '#fff', padding: '12px 24px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
        ▶ Watch Now on Vallavan
      </a>
    </main>
  );
}
