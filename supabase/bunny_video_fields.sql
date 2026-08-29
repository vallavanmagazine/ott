-- ============================================================================
-- Bunny Stream support: provider tag, Bunny video GUID and thumbnail on every
-- table that carries a video_url. Run once in the SQL Editor.
--
-- ADDITIVE ONLY — nothing here rewrites an existing row's video_url. Every
-- current row (DyneTube HLS, YouTube embed, or a local playout filename) is
-- backfilled to video_provider = 'legacy' and keeps playing exactly as it does
-- today; the players do not read these columns at all. Only the new Bunny
-- upload path (POST /api/bunny/videos/:guid/confirm) ever writes 'bunny'.
--
-- The four tables below are the complete set carrying video_url — added by
-- rls_and_tables.sql (documentaries, live_slots), video_urls.sql (feed_reels,
-- inspire_items) and admin_dashboard.sql (live_slots). Keep this list in step
-- with those if a fifth video-bearing table is ever introduced.
--
-- Idempotent (add column if not exists) — safe to re-run.
-- ============================================================================

-- Documentaries — long-form content, the primary Bunny target.
alter table documentaries add column if not exists video_provider text default 'legacy';
alter table documentaries add column if not exists bunny_video_id text;
alter table documentaries add column if not exists thumbnail_url  text;

-- Feed reels — short vertical video.
alter table feed_reels    add column if not exists video_provider text default 'legacy';
alter table feed_reels    add column if not exists bunny_video_id text;
alter table feed_reels    add column if not exists thumbnail_url  text;

-- Inspire items — short motivational clips.
alter table inspire_items add column if not exists video_provider text default 'legacy';
alter table inspire_items add column if not exists bunny_video_id text;
alter table inspire_items add column if not exists thumbnail_url  text;

-- Live slots — scheduled channel programming (VOD source for the playout rig).
alter table live_slots    add column if not exists video_provider text default 'legacy';
alter table live_slots    add column if not exists bunny_video_id text;
alter table live_slots    add column if not exists thumbnail_url  text;

-- Verify: every table should report three new columns, and no row should have
-- a null video_provider once the default has backfilled.
--
-- select table_name, column_name from information_schema.columns
--   where column_name in ('video_provider','bunny_video_id','thumbnail_url')
--   order by table_name, column_name;
--
-- select 'documentaries' as tbl, count(*) filter (where video_provider is null) as null_provider
--   from documentaries;

-- END bunny_video_fields.sql
