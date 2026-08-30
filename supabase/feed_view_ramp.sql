-- Optional columns for the Feed view ramp (see src/lib/view-ramp.ts).
--
-- OPTIONAL is meant literally: the ramp works today without this file. Without
-- these columns it measures from created_at and derives each row's starting
-- number deterministically from its id. Applying this only makes both explicit
-- and editable per row — useful if a reel is drafted long before it is
-- published, since created_at would then be the wrong zero point.
--
-- Nothing here touches sponsor or billing data. Campaign reporting reads
-- ad_events, and sponsor charges come from campaigns.daily_rate_paise and the
-- per-post pricing config — none of which involve feed_reels at all.
--
-- Apply with:  psql "$DATABASE_URL" -f supabase/feed_view_ramp.sql
--          or: paste into the Supabase SQL editor and run.

alter table public.feed_reels
  add column if not exists published_at        timestamptz,
  add column if not exists initial_seed_views  int;

-- Anything already live was published when it was created, near enough.
update public.feed_reels
   set published_at = created_at
 where published_at is null;

-- A one-off starting number in the 30-150 range the ramp expects. Derived from
-- the id so re-running this file cannot reshuffle numbers that are already on
-- screen; the same rule the client falls back to when the column is null.
update public.feed_reels
   set initial_seed_views = 30 + (abs(hashtext(id::text)) % 121)
 where initial_seed_views is null;

-- Stamp the publish moment when a row first goes Published, so a long-drafted
-- reel ramps from when viewers could actually see it rather than from creation.
create or replace function public.stamp_feed_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Published' and new.published_at is null then
    new.published_at := now();
  end if;
  if new.initial_seed_views is null then
    new.initial_seed_views := 30 + (abs(hashtext(new.id::text)) % 121);
  end if;
  return new;
end;
$$;

drop trigger if exists feed_reels_stamp_published_at on public.feed_reels;
create trigger feed_reels_stamp_published_at
  before insert or update of status on public.feed_reels
  for each row execute function public.stamp_feed_published_at();
