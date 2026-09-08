-- ============================================================================
-- VALLAVAN — apply_all_missing.sql
--
-- ONE consolidated, idempotent migration that creates every object the
-- verify_migrations.sql run reported MISSING from the live database, plus a
-- few companion objects that belong to the same never-applied migration files
-- but were not on the verification checklist (so they were missing silently).
--
-- Every statement is safe to run again:
--   • columns  -> ADD COLUMN IF NOT EXISTS
--   • functions-> CREATE OR REPLACE
--   • triggers -> DROP TRIGGER IF EXISTS + CREATE
--   • policies -> DROP POLICY IF EXISTS + CREATE POLICY
--   • indexes  -> CREATE INDEX IF NOT EXISTS
--   • backfills-> guarded with WHERE ... IS NULL / <> normalized
--
-- Wrapped in a single transaction: if any statement fails the whole thing
-- rolls back, so you can never end up half-applied again (which is what
-- produced the present gap). Run ONCE, in full, in the Supabase SQL Editor.
--
-- Definitions are copied verbatim from the source migration files — NOT
-- reconstructed. In particular find_user_by_phone is the NORMALIZED version
-- from fix_phone_login.sql (last-10-digit match on both sides), never the old
-- exact-match body from the original fix_phone_auth.sql.
--
-- Depends on objects the verify run reported PRESENT: public.is_admin(),
-- and the base tables (app_users, sponsors, freelancers, otp_verifications,
-- feed_reels, task_assignments, freelancer_earnings, content_categories).
-- ============================================================================

begin;

-- ===========================================================================
-- 1. COLUMNS  (create before the functions / triggers / policies that use them)
-- ===========================================================================

-- fix_phone_auth.sql — phone on app_users (find_user_by_phone reads it).
alter table app_users add column if not exists phone text;

-- fix_email.sql — newsletter/promotional consent flag.
alter table app_users add column if not exists email_opt_out boolean default false;

-- feed_view_ramp.sql — explicit publish moment + starting view seed.
alter table public.feed_reels
  add column if not exists published_at       timestamptz,
  add column if not exists initial_seed_views int;

-- ===========================================================================
-- 2. DATA BACKFILLS  (idempotent; depend on the columns above)
-- ===========================================================================

-- feed_view_ramp.sql — anything already live was published at creation.
update public.feed_reels
   set published_at = created_at
 where published_at is null;

-- feed_view_ramp.sql — one-off starting number in the 30-150 range, derived
-- from the id so re-running cannot reshuffle numbers already on screen.
update public.feed_reels
   set initial_seed_views = 30 + (abs(hashtext(id::text)) % 121)
 where initial_seed_views is null;

-- fix_phone_login.sql — repair any legacy phone rows to the canonical bare-10
-- form so the normalized find_user_by_phone can match them.
update app_users
   set phone = right(regexp_replace(phone, '[^0-9]', '', 'g'), 10)
 where phone is not null
   and phone <> right(regexp_replace(phone, '[^0-9]', '', 'g'), 10);

update sponsors
   set phone = right(regexp_replace(phone, '[^0-9]', '', 'g'), 10)
 where phone is not null
   and phone <> right(regexp_replace(phone, '[^0-9]', '', 'g'), 10);

update freelancers
   set phone = right(regexp_replace(phone, '[^0-9]', '', 'g'), 10)
 where phone is not null
   and phone <> right(regexp_replace(phone, '[^0-9]', '', 'g'), 10);

-- ===========================================================================
-- 3. FUNCTIONS  (CREATE OR REPLACE)
-- ===========================================================================

-- fix_phone_login.sql — NORMALIZED login lookup. Both sides reduced to the
-- last 10 digits, so a match can't break on +91 / spaces / leading 0. This is
-- the version that supersedes the old exact-match body (the M7 landmine).
-- SECURITY DEFINER so anon does not need broad SELECT on app_users.
create or replace function find_user_by_phone(p text)
returns table(id uuid, name text, email text, role text, phone text, sponsor_id uuid, freelancer_id uuid)
language sql security definer set search_path = public as $$
  select u.id, u.name, u.email, u.role, u.phone,
    (select s.id from sponsors s where s.owner_id = u.id or lower(s.email) = lower(u.email) limit 1),
    (select f.id from freelancers f where f.user_id = u.id or lower(f.email) = lower(u.email) limit 1)
  from app_users u
  where right(regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g'), 10)
      = right(regexp_replace(coalesce(p, ''),        '[^0-9]', '', 'g'), 10)
    and lower(coalesce(u.role, '')) in ('sponsor', 'freelancer')
  order by u.created_at desc nulls last
  limit 1;
$$;
grant execute on function find_user_by_phone(text) to anon, authenticated;

-- fix_email.sql — public unsubscribe. SECURITY DEFINER so an anonymous footer
-- click can flip the flag without a broad UPDATE policy on app_users.
create or replace function set_email_opt_out(p_email text, p_out boolean)
returns void
language sql security definer set search_path = public as $$
  update app_users set email_opt_out = p_out where lower(email) = lower(p_email);
$$;
grant execute on function set_email_opt_out(text, boolean) to anon, authenticated;

-- feed_metrics_rpc.sql — bounded like/share counter bump. SECURITY DEFINER to
-- bypass the admin-write RLS on feed_reels, but locked to two named columns and
-- a ±1 delta so it can't become a general-purpose write.
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

-- feed_view_ramp.sql — stamp the publish moment when a reel first goes
-- Published, and seed its starting view count. Paired with the trigger below.
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

-- ===========================================================================
-- 4. TRIGGERS  (depend on the function + columns above)
-- ===========================================================================

-- feed_view_ramp.sql — NOT on the verify checklist (only the function was), so
-- it was missing silently. The function is inert without it.
drop trigger if exists feed_reels_stamp_published_at on public.feed_reels;
create trigger feed_reels_stamp_published_at
  before insert or update of status on public.feed_reels
  for each row execute function public.stamp_feed_published_at();

-- ===========================================================================
-- 5. INDEXES
-- ===========================================================================

-- fix_phone_auth.sql — recent-OTP lookup index. NOT on the verify checklist;
-- companion to the otp anon policies below, so it was missing silently.
create index if not exists otp_phone_recent on otp_verifications (phone, created_at desc);

-- ===========================================================================
-- 6. POLICIES  (RLS enabled defensively first; is_admin() is already PRESENT)
-- ===========================================================================

-- fix_phone_auth.sql — dev-mode client OTP: anon insert / select / consume.
-- (RLS is already on; ENABLE is a no-op if so.)
alter table otp_verifications enable row level security;
drop policy if exists anon_insert_otp on otp_verifications;
create policy anon_insert_otp on otp_verifications for insert with check (true);
drop policy if exists anon_verify_otp on otp_verifications;
create policy anon_verify_otp on otp_verifications for select using (true);
drop policy if exists anon_consume_otp on otp_verifications;
create policy anon_consume_otp on otp_verifications for update using (true) with check (true);

-- fix_phone_auth.sql — anon account creation (phone-auth flow, no Supabase
-- Auth; ids are generated client-side). WITHOUT these, registration inserts are
-- blocked by RLS — the direct cause of the "could not create account" failures.
alter table app_users enable row level security;
drop policy if exists anon_create_appuser on app_users;
create policy anon_create_appuser on app_users for insert with check (true);

alter table sponsors enable row level security;
drop policy if exists anon_create_sponsor on sponsors;
create policy anon_create_sponsor on sponsors for insert with check (true);

alter table freelancers enable row level security;
drop policy if exists anon_create_freelancer on freelancers;
create policy anon_create_freelancer on freelancers for insert with check (true);

-- fix_categories_roles.sql — admin manage categories. (pub_read_categories is
-- reported present; recreated here defensively so the pair is coherent.)
alter table content_categories enable row level security;
drop policy if exists pub_read_categories on content_categories;
create policy pub_read_categories on content_categories for select using (is_active or public.is_admin());
drop policy if exists admin_manage_categories on content_categories;
create policy admin_manage_categories on content_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- fix_categories_roles.sql — freelancer content access: read own assignments,
-- UPDATE (submit) own assignments, read own earnings. fl_update_own_assignments
-- was NOT on the verify checklist, so it was missing silently — without it an
-- approved freelancer cannot submit finished content.
alter table task_assignments enable row level security;
drop policy if exists fl_read_own_assignments on task_assignments;
create policy fl_read_own_assignments on task_assignments for select to authenticated
  using (public.is_admin() or freelancer_id in (
    select f.id from freelancers f
    join app_users u on u.id = f.user_id
    where lower(u.email) = lower(auth.jwt() ->> 'email')));

drop policy if exists fl_update_own_assignments on task_assignments;
create policy fl_update_own_assignments on task_assignments for update to authenticated
  using (public.is_admin() or freelancer_id in (
    select f.id from freelancers f
    join app_users u on u.id = f.user_id
    where lower(u.email) = lower(auth.jwt() ->> 'email')));

alter table freelancer_earnings enable row level security;
drop policy if exists fl_read_own_earnings on freelancer_earnings;
create policy fl_read_own_earnings on freelancer_earnings for select to authenticated
  using (public.is_admin() or freelancer_id in (
    select f.id from freelancers f
    join app_users u on u.id = f.user_id
    where lower(u.email) = lower(auth.jwt() ->> 'email')));

commit;

-- ============================================================================
-- After running: re-run verify_migrations.sql. Every row should now report
-- PRESENT, and otp_verifications.phone should report NULLABLE = YES (that was
-- already fixed by fix_email_otp.sql and is not touched here).
-- ============================================================================
