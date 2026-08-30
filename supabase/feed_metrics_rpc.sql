-- Feed engagement counters (Part D).
--
-- feed_reels.likes / .shares / .comments already exist as ints; nothing wrote
-- to them, so the numbers a viewer saw were whatever the seed put there.
--
-- Viewers are anonymous, and feed_reels is admin-write under RLS, so a direct
-- UPDATE from the browser is (correctly) refused. This function is the narrow
-- exception: SECURITY DEFINER so it bypasses RLS, but it can only ever move two
-- named columns on one row by a bounded delta — it cannot be turned into a
-- general-purpose write. The counter is clamped at zero so a duplicated unlike
-- can never drive it negative.
--
-- Apply with:  psql "$DATABASE_URL" -f supabase/feed_metrics_rpc.sql
--          or: paste into the Supabase SQL editor and run.

create or replace function public.bump_feed_metric(
  p_id     uuid,
  p_metric text,
  p_delta  int
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new int;
begin
  -- Allowlist, not interpolation: p_metric comes from the browser.
  if p_metric not in ('likes', 'shares') then
    raise exception 'bump_feed_metric: unsupported metric %', p_metric;
  end if;

  -- One step at a time, so a scripted caller cannot inflate a count in bulk.
  if p_delta not in (-1, 1) then
    raise exception 'bump_feed_metric: delta must be -1 or 1, got %', p_delta;
  end if;

  if p_metric = 'likes' then
    update feed_reels
       set likes = greatest(0, coalesce(likes, 0) + p_delta)
     where id = p_id
    returning likes into v_new;
  else
    update feed_reels
       set shares = greatest(0, coalesce(shares, 0) + p_delta)
     where id = p_id
    returning shares into v_new;
  end if;

  if v_new is null then
    raise exception 'bump_feed_metric: no feed_reels row with id %', p_id;
  end if;

  return v_new;
end;
$$;

revoke all on function public.bump_feed_metric(uuid, text, int) from public;
grant execute on function public.bump_feed_metric(uuid, text, int) to anon, authenticated;
