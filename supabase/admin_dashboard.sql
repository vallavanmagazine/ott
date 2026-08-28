-- ============================================================================
-- VALLAVAN — Admin dashboard overhaul. Run ONCE in the Supabase SQL Editor.
-- Re-runnable (every statement is idempotent / guarded).
--
-- Adds the three things the fully-functional admin CMS needs and the earlier
-- migrations did not provide:
--   1. site_settings  — publicly readable CMS copy (platform_settings is
--                       write-only by design and cannot be read back).
--   2. admin READ on the wallet tables (only sponsor-scoped policies existed,
--      so the admin payments screen saw nothing).
--   3. a few small columns the richer admin forms write to.
--
-- Depends on: schema.sql, rls_and_tables.sql (public.is_admin()), section_f.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. site_settings — public CMS configuration (NOT secrets).
--    Secrets stay in platform_settings, which has no SELECT policy.
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);
alter table site_settings enable row level security;

drop policy if exists pub_read_site_settings on site_settings;
create policy pub_read_site_settings on site_settings for select using (true);

drop policy if exists admin_all_site_settings on site_settings;
create policy admin_all_site_settings on site_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

insert into site_settings (key, value) values
  ('SITE_TITLE',       'Vallavan — Documentaries That Matter'),
  ('SITE_TAGLINE',     'Tamil-first digital documentary OTT platform. Free for everyone, supported by sponsors.'),
  ('CONTACT_EMAIL',    'hello@vallavan.in'),
  ('DEFAULT_LANGUAGE', 'Tamil')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Admin access to the money tables.
--    wallet_client_rls.sql granted sponsor-scoped access only, so the admin
--    payments/sponsor screens returned zero rows for an admin.
-- ---------------------------------------------------------------------------
alter table wallets             enable row level security;
alter table wallet_transactions enable row level security;
alter table pricing_config      enable row level security;

drop policy if exists admin_all_wallets on wallets;
create policy admin_all_wallets on wallets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_wallet_txn on wallet_transactions;
create policy admin_all_wallet_txn on wallet_transactions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists admin_all_pricing_config on pricing_config;
create policy admin_all_pricing_config on pricing_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Columns the richer admin forms write.
-- ---------------------------------------------------------------------------
-- Inspire items get a publish state like every other content type.
alter table inspire_items add column if not exists status text not null default 'Published';
create index if not exists inspire_items_status_idx on inspire_items (status);

-- Live slots: an explicit sort key is already present; make sure the ad break
-- and playout URL columns exist even if rls_and_tables.sql was skipped.
alter table live_slots add column if not exists video_url text;
alter table live_slots add column if not exists break_after_sec int default 60;

-- RSS feed rows are toggled on/off from Broadcast Control.
alter table rss_feeds add column if not exists is_active boolean default true;

-- Lower third can be driven from the schedule or overridden with fixed text.
alter table broadcast_config add column if not exists lower_third_text text default '';
alter table broadcast_config add column if not exists lower_third_auto boolean default true;

-- Ties a queued payout to the exact assignment it came from. Without it,
-- releasing payment has to match on (freelancer, amount, pending), which can
-- pick the wrong row when a freelancer has two equal-value pending payouts.
alter table freelancer_earnings
  add column if not exists assignment_id uuid references task_assignments(id) on delete set null;
create index if not exists earnings_assignment_idx on freelancer_earnings (assignment_id);

-- Public read for the inspire publish filter (viewers only see Published).
drop policy if exists pub_read_inspire on inspire_items;
create policy pub_read_inspire on inspire_items for select using (status = 'Published' or public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Indexes for the analytics rollups the dashboard runs client-side.
-- ---------------------------------------------------------------------------
create index if not exists ad_events_district_idx on ad_events (district);
create index if not exists ad_events_created_idx  on ad_events (created_at desc);
create index if not exists wallet_txn_sponsor_idx on wallet_transactions (sponsor_id, created_at desc);
create index if not exists invoices_sponsor_idx   on invoices (sponsor_id, created_at desc);
create index if not exists assignments_task_idx   on task_assignments (task_id);
create index if not exists earnings_status_idx    on freelancer_earnings (status, created_at desc);

-- ============================================================================
-- END admin_dashboard.sql
-- ============================================================================
