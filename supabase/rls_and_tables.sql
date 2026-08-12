-- ============================================================================
-- VALLAVAN — Phase 1–14 SQL: write RLS policies + new tables + schema additions
-- Run ONCE in the Supabase SQL Editor. Re-runnable (drops/creates idempotently).
--
-- SECURITY MODEL (important): the anon key is public (ships in the frontend
-- bundle). We therefore NEVER grant world writes. All writes require an
-- AUTHENTICATED user who is either an admin (app_users.role='Admin') or the
-- owning sponsor. Public users keep read-only access to published content.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Admin predicate — true when the current authed user maps to an Admin row.
--    SECURITY DEFINER so it can read app_users regardless of RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users
    where lower(email) = lower(auth.jwt() ->> 'email')
      and role = 'Admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- 1. Schema additions needed by later phases (idempotent)
-- ---------------------------------------------------------------------------
alter table campaigns     add column if not exists target_districts text[] default '{}';
alter table documentaries add column if not exists video_url text;
alter table live_slots    add column if not exists video_url text;
alter table live_slots    add column if not exists break_after_sec int default 60;

-- ---------------------------------------------------------------------------
-- 2. New tables (Phase 6/7/8)
-- ---------------------------------------------------------------------------
create table if not exists broadcast_config (
  id                   int primary key default 1,
  logo_enabled         boolean default true,
  logo_position        text default 'bottom-right',
  logo_opacity         int default 70,
  ticker_enabled       boolean default true,
  ticker_speed         text default 'medium',
  lower_third_enabled  boolean default true,
  lband_enabled        boolean default false,
  lband_sponsor_id     uuid references sponsors(id),
  lband_position       text default 'right',
  breaking_active      boolean default false,
  breaking_headline    text default '',
  breaking_body        text default '',
  weather_enabled      boolean default true,
  weather_city         text default 'Chennai',
  powered_by_enabled   boolean default false,
  powered_by_sponsor_id uuid references sponsors(id),
  ad_break_duration_sec int default 60,
  updated_at           timestamptz default now(),
  constraint broadcast_config_singleton check (id = 1)
);
insert into broadcast_config (id) values (1) on conflict (id) do nothing;

create table if not exists ticker_items (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  text_ta    text,
  source     text default 'manual',   -- 'manual' | 'rss'
  is_active  boolean default true,
  priority   int default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists ticker_items_active_idx on ticker_items (is_active, created_at desc);

create table if not exists rss_feeds (
  id              uuid primary key default gen_random_uuid(),
  url             text not null,
  name            text not null,
  is_active       boolean default true,
  last_fetched_at timestamptz,
  created_at      timestamptz default now()
);

create table if not exists ad_insert_points (
  id            uuid primary key default gen_random_uuid(),
  live_slot_id  uuid not null references live_slots(id) on delete cascade,
  insert_at_sec int not null,
  duration_sec  int not null default 30,
  ad_type       text default 'auto',    -- 'auto' | 'fixed'
  fixed_ad_id   uuid references ads(id),
  sort_order    int default 0,
  created_at    timestamptz default now()
);
create index if not exists ad_insert_points_slot_idx on ad_insert_points (live_slot_id, sort_order);

-- Enable RLS on the new tables
alter table broadcast_config enable row level security;
alter table ticker_items     enable row level security;
alter table rss_feeds        enable row level security;
alter table ad_insert_points enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Public READ on broadcast surfaces the viewer app needs (overlay/ticker/ads)
-- ---------------------------------------------------------------------------
drop policy if exists pub_read_broadcast on broadcast_config;
create policy pub_read_broadcast on broadcast_config for select using (true);

drop policy if exists pub_read_ticker on ticker_items;
create policy pub_read_ticker on ticker_items for select
  using (is_active and (expires_at is null or expires_at > now()));

drop policy if exists pub_read_adpoints on ad_insert_points;
create policy pub_read_adpoints on ad_insert_points for select using (true);

-- ---------------------------------------------------------------------------
-- 4. ADMIN write access (INSERT/UPDATE/DELETE/SELECT) on all admin-managed
--    tables. Permissive policies OR with existing public-read policies, so
--    this only ADDS admin power, never restricts public reads.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'documentaries','feed_reels','live_slots','inspire_items','ads',
    'ad_placements','notifications','sponsors','districts','trending_searches',
    'app_users','broadcast_config','ticker_items','rss_feeds','ad_insert_points'
  ]
  loop
    execute format('drop policy if exists admin_all_%1$s on %1$I;', t);
    execute format(
      'create policy admin_all_%1$s on %1$I for all to authenticated '
      'using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Campaign lifecycle: admin full control + sponsor owns their own rows
-- ---------------------------------------------------------------------------
drop policy if exists admin_all_campaigns on campaigns;
create policy admin_all_campaigns on campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists sponsor_rw_campaigns on campaigns;
create policy sponsor_rw_campaigns on campaigns for all to authenticated
  using (sponsor_id in (select id from sponsors where owner_id = auth.uid()))
  with check (sponsor_id in (select id from sponsors where owner_id = auth.uid()));

-- Ads: admin covered by admin_all_ads above; add sponsor ownership.
drop policy if exists sponsor_rw_ads on ads;
create policy sponsor_rw_ads on ads for all to authenticated
  using (sponsor_id in (select id from sponsors where owner_id = auth.uid()))
  with check (sponsor_id in (select id from sponsors where owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 6. app_users: a signed-in user may read their OWN row (for role lookup);
--    admins may read all (covered by admin_all_app_users).
-- ---------------------------------------------------------------------------
drop policy if exists auth_read_own_appuser on app_users;
create policy auth_read_own_appuser on app_users for select to authenticated
  using (public.is_admin() or lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------------------------------------------------------------------------
-- 7. audit_logs: admins read; any authenticated user may append (so both
--    admin and sponsor actions can be recorded).
-- ---------------------------------------------------------------------------
drop policy if exists admin_read_audit on audit_logs;
create policy admin_read_audit on audit_logs for select to authenticated
  using (public.is_admin());

drop policy if exists auth_insert_audit on audit_logs;
create policy auth_insert_audit on audit_logs for insert to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- 8. AFTER running this SQL — create the auth users + link app_users rows.
--    (Phase 2 needs these; passwords are set in the Auth dashboard.)
--
--   a) Supabase Dashboard → Authentication → Users → "Add user":
--        admin@vallavan.in   (choose a password)
--        ads@tamiltea.in     (choose a password)
--
--   b) Then run these INSERTs so the app can resolve their roles.
--      owner_id links a sponsor to their auth user id (copy the sponsor auth
--      user's UUID from the Auth dashboard into <ADS_AUTH_UID>).
-- ---------------------------------------------------------------------------
insert into app_users (name, email, role, status)
values ('Vallavan Admin', 'admin@vallavan.in', 'Admin', 'Active')
on conflict (email) do update set role = 'Admin', status = 'Active';

insert into app_users (name, email, role, status)
values ('Tamil Tea Co.', 'ads@tamiltea.in', 'Sponsor', 'Active')
on conflict (email) do nothing;

-- Optional: create a sponsor org owned by the sponsor auth user so the sponsor
-- dashboard shows their data. Replace <ADS_AUTH_UID> with that user's auth UID.
-- insert into sponsors (name, email, status, owner_id)
-- values ('Tamil Tea Co.', 'ads@tamiltea.in', 'Active', '<ADS_AUTH_UID>')
-- on conflict do nothing;

-- ============================================================================
-- END. After this: Phase 1 admin CRUD, Phase 2 auth, Phase 3 sponsor flows,
-- and the Phase 6–8 broadcast/ticker/ad-timer features are all unblocked.
-- ============================================================================
