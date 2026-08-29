import { supabase, SITE_URL } from '../../lib/supabase';

export const revalidate = 3600;

/**
 * Dynamic sitemap generated from live CMS content — all four content types.
 *
 * Status filtering differs per table and is not incidental:
 *   documentaries  status enum   'Published'
 *   feed_reels     status enum   'Published' (also has a 'Scheduled' state)
 *   inspire_items  status TEXT   'Published' (added later by admin_dashboard.sql,
 *                                as text rather than the content_status enum)
 *   live_slots     NO status column at all — every row is listed.
 * Filtering live_slots by status would throw, not silently return nothing.
 */
export async function GET() {
  const [docs, reels, inspire, slots] = await Promise.all([
    supabase.from('documentaries').select('id').eq('status', 'Published'),
    supabase.from('feed_reels').select('id').eq('status', 'Published'),
    supabase.from('inspire_items').select('id').eq('status', 'Published'),
    supabase.from('live_slots').select('id'),
  ]);

  const genres = ['Environment', 'Wildlife', 'History', 'Science', 'Society', 'Investigation', 'Education', 'Culture'];

  const ids = (r: { data: { id: string }[] | null }) => r.data ?? [];

  const urls = [
    `${SITE_URL}/`,
    ...genres.map((g) => `${SITE_URL}/genre/${encodeURIComponent(g)}`),
    ...ids(docs).map((d) => `${SITE_URL}/documentaries/${d.id}`),
    ...ids(reels).map((d) => `${SITE_URL}/videos/${d.id}`),
    ...ids(inspire).map((d) => `${SITE_URL}/inspire/${d.id}`),
    ...ids(slots).map((d) => `${SITE_URL}/live/${d.id}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
