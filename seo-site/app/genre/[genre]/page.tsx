import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase, type Doc } from '../../../lib/supabase';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { genre: string } }): Promise<Metadata> {
  const genre = decodeURIComponent(params.genre);
  return {
    title: `${genre} Documentaries`,
    description: `Watch Tamil ${genre.toLowerCase()} documentaries on Vallavan — free, sponsor-supported.`,
  };
}

export default async function GenrePage({ params }: { params: { genre: string } }) {
  const genre = decodeURIComponent(params.genre);
  const { data } = await supabase
    .from('documentaries')
    .select('id, title, synopsis, genre, poster, backdrop, year, duration_sec, language')
    .eq('status', 'Published').eq('genre', genre).order('created_at', { ascending: false });
  const docs = (data ?? []) as Doc[];

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 30, fontWeight: 900 }}>{genre} Documentaries</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginTop: 20 }}>
        {docs.map((d) => (
          <Link key={d.id} href={`/documentaries/${d.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
            <img src={d.poster} alt={d.title} style={{ width: '100%', borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover' }} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>{d.title}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
