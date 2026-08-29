-- ============================================================================
-- Human-readable slugs for the two content types the app actually navigates:
-- feed_reels and live_slots. Run once in the SQL Editor.
--
-- documentaries and inspire_items are deliberately NOT included — they are not
-- part of the real app's navigation and keep using /documentaries/{id} and
-- /inspire/{id}.
--
-- The index is UNIQUE but PARTIAL (where slug is not null), so rows created
-- before the backfill runs — and any row whose slug is cleared — do not collide
-- on a shared NULL. The seo-site routes look up by slug first and fall back to
-- id, so an un-slugged row stays reachable either way.
--
-- Idempotent: add column if not exists, create index if not exists, and the
-- backfill only touches rows where slug is null.
-- ============================================================================

alter table feed_reels add column if not exists slug text;
create unique index if not exists feed_reels_slug_idx on feed_reels(slug) where slug is not null;

alter table live_slots add column if not exists slug text;
create unique index if not exists live_slots_slug_idx on live_slots(slug) where slug is not null;

-- ---------------------------------------------------------------------------
-- Backfill
--
-- Rule: lowercase the English title, collapse every run of non-[a-z0-9] into a
-- single hyphen, trim leading/trailing hyphens, then de-duplicate with -2/-3.
--
-- Two details that matter for this dataset:
--   * Titles are bilingual. Slugs are built from `title` (English), never
--     `title_ta` — a Tamil title contains no [a-z0-9] at all, so slugifying it
--     yields an empty string.
--   * Hence the fallback: a title that reduces to nothing (Tamil-only, emoji,
--     punctuation-only, or empty) gets '<kind>-<first 8 chars of uuid>', which
--     is stable and unique rather than a collision-prone constant.
--
-- Numbering is ordered by id so a re-run on the same data is deterministic.
-- ---------------------------------------------------------------------------

with cand as (
  select id,
         coalesce(
           nullif(trim(both '-' from regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', '-', 'g')), ''),
           'reel-' || left(id::text, 8)
         ) as base
    from feed_reels
   where slug is null
),
numbered as (
  select id, base, row_number() over (partition by base order by id) as rn
    from cand
)
update feed_reels f
   set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
  from numbered n
 where f.id = n.id;

with cand as (
  select id,
         coalesce(
           nullif(trim(both '-' from regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', '-', 'g')), ''),
           'live-' || left(id::text, 8)
         ) as base
    from live_slots
   where slug is null
),
numbered as (
  select id, base, row_number() over (partition by base order by id) as rn
    from cand
)
update live_slots l
   set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
  from numbered n
 where l.id = n.id;

-- Verify: both should return zero rows once the backfill has run.
--
-- select 'feed_reels' as tbl, id, title from feed_reels where slug is null
-- union all
-- select 'live_slots', id, title from live_slots where slug is null;
--
-- And a duplicate check (the unique index already enforces this):
-- select slug, count(*) from feed_reels group by slug having count(*) > 1;

-- END feed_live_slugs.sql
