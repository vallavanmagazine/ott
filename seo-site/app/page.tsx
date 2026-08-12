import Link from 'next/link';
import { supabase, type Doc } from '../lib/supabase';

export const revalidate = 3600;

export default async function Home() {
  const { data } = await supabase
    .from('documentaries')
    .select('id, title, synopsis, genre, poster, backdrop, year, duration_sec, language')
    .eq('status', 'Published')
    .order('created_at', { ascending: false })
    .limit(24);
  const docs = (data ?? []) as Doc[];

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 34, fontWeight: 900 }}>Vallavan — Documentaries That Matter</h1>
      <p style={{ color: '#A0A0A0' }}>Tamil-first documentary streaming. Free, supported by sponsors.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginTop: 24 }}>
        {docs.map((d) => (
          <Link key={d.id} href={`/documentaries/${d.id}`} style={{ color: '#fff', textDecoration: 'none' }}>
            <img src={d.poster} alt={d.title} style={{ width: '100%', borderRadius: 12, aspectRatio: '16/9', objectFit: 'cover' }} />
            <div style={{ fontWeight: 700, marginTop: 8 }}>{d.title}</div>
            <div style={{ color: '#A0A0A0', fontSize: 12 }}>{d.genre} · {d.year}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
