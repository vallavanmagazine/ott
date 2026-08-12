import { supabase, SITE_URL } from '../../lib/supabase';

export const revalidate = 3600;

/** Dynamic sitemap generated from live CMS content. */
export async function GET() {
  const { data: docs } = await supabase
    .from('documentaries').select('id').eq('status', 'Published');

  const genres = ['Environment', 'Wildlife', 'History', 'Science', 'Society', 'Investigation', 'Education', 'Culture'];

  const urls = [
    `${SITE_URL}/`,
    ...genres.map((g) => `${SITE_URL}/genre/${encodeURIComponent(g)}`),
    ...(docs ?? []).map((d: { id: string }) => `${SITE_URL}/documentaries/${d.id}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
