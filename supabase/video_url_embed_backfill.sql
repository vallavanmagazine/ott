-- ============================================================================
-- VALLAVAN — normalise stored YouTube URLs to embed form. OPTIONAL, run once.
--
-- New saves are normalised at the write boundary (services/admin-writes.ts →
-- lib/video.ts toEmbedUrl), and the player converts on load as a fallback, so
-- legacy rows already play correctly without this. Run it anyway to keep the
-- stored data canonical for other consumers (the SEO site, exports, the
-- playout rig), which do not go through the player's fallback.
--
-- Rewrites watch / youtu.be / shorts / live / v links to
--   https://www.youtube.com/embed/{id}
-- Rows already in embed form do NOT match the pattern and are left untouched,
-- so this is idempotent and safe to re-run.
-- ============================================================================

-- The capture group is shared by every statement below.
-- (?:...) alternatives cover every non-embed YouTube URL shape we accept.
do $$
declare
  yt_pattern text :=
    '(?:youtube\.com/watch\?(?:.*&)?v=|youtu\.be/|youtube\.com/shorts/|youtube\.com/live/|youtube\.com/v/)([A-Za-z0-9_-]{11})';
  t text;
  updated int;
begin
  foreach t in array array['feed_reels', 'documentaries', 'live_slots', 'inspire_items']
  loop
    execute format(
      'update %I
          set video_url = ''https://www.youtube.com/embed/'' || substring(video_url from %L)
        where video_url is not null
          and video_url ~ %L',
      t, yt_pattern, yt_pattern);
    get diagnostics updated = row_count;
    raise notice '%: % row(s) normalised', t, updated;
  end loop;
end $$;

-- Verify: this should return zero rows once the backfill has run.
-- select 'feed_reels' as tbl, id, video_url from feed_reels
--   where video_url ~ '(youtube\.com/watch|youtu\.be/|youtube\.com/shorts/|youtube\.com/live/)'
-- union all
-- select 'documentaries', id, video_url from documentaries
--   where video_url ~ '(youtube\.com/watch|youtu\.be/|youtube\.com/shorts/|youtube\.com/live/)'
-- union all
-- select 'live_slots', id, video_url from live_slots
--   where video_url ~ '(youtube\.com/watch|youtu\.be/|youtube\.com/shorts/|youtube\.com/live/)'
-- union all
-- select 'inspire_items', id, video_url from inspire_items
--   where video_url ~ '(youtube\.com/watch|youtu\.be/|youtube\.com/shorts/|youtube\.com/live/)';

-- ============================================================================
-- END video_url_embed_backfill.sql
-- ============================================================================
