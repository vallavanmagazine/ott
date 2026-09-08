-- ============================================================================
-- VALLAVAN — migration verification (READ ONLY). Run ONCE in the Supabase SQL
-- Editor. It changes nothing; it reports PRESENT / MISSING for every table,
-- column, function and critical policy that the repo's migrations claim to add,
-- so you can see in one query what is actually live vs. only in the repo.
--
-- Anything that reports MISSING = that migration file was never applied (or
-- only partially). Ordered MISSING-first so gaps are at the top.
-- ============================================================================

with
-- ---- TABLES ---------------------------------------------------------------
tbl(name) as (values
  -- schema.sql
  ('documentaries'),('inspire_items'),('live_slots'),('feed_reels'),
  ('app_users'),('sponsors'),('campaigns'),('districts'),('campaign_districts'),
  ('ads'),('ad_placements'),('notifications'),('audit_logs'),('trending_searches'),
  ('wallets'),('wallet_transactions'),('pricing_config'),
  -- rls_and_tables.sql
  ('broadcast_config'),('ticker_items'),('rss_feeds'),('ad_insert_points'),('ad_events'),
  -- phase5_19.sql
  ('platform_settings'),('otp_verifications'),
  -- section_f.sql
  ('pricing_rates'),('inspire_packages'),('payment_links'),('invoices'),
  ('social_posts'),('freelancers'),('freelancer_tasks'),('task_assignments'),
  ('freelancer_earnings'),('magazine_orders'),('ad_sales_log'),('inspire_orders'),
  -- fix_categories_roles.sql / admin_dashboard.sql
  ('content_categories'),('site_settings')
),
-- ---- COLUMNS (table, column) ----------------------------------------------
col(tbl, col) as (values
  ('campaigns','target_districts'),('campaigns','daily_rate_paise'),
  ('documentaries','video_url'),('documentaries','video_provider'),('documentaries','bunny_video_id'),('documentaries','thumbnail_url'),
  ('live_slots','video_url'),('live_slots','break_after_sec'),('live_slots','video_provider'),('live_slots','bunny_video_id'),('live_slots','thumbnail_url'),('live_slots','slug'),
  ('feed_reels','video_url'),('feed_reels','video_provider'),('feed_reels','bunny_video_id'),('feed_reels','thumbnail_url'),('feed_reels','slug'),('feed_reels','published_at'),('feed_reels','initial_seed_views'),
  ('inspire_items','video_url'),('inspire_items','is_sponsored'),('inspire_items','sponsor_id'),('inspire_items','sponsor_logo_url'),('inspire_items','status'),('inspire_items','video_provider'),('inspire_items','bunny_video_id'),('inspire_items','thumbnail_url'),
  ('sponsors','gst_number'),('sponsors','business_type'),('sponsors','owner_name'),('sponsors','phone'),('sponsors','district'),
  ('app_users','phone'),('app_users','email_opt_out'),
  ('broadcast_config','channel_live'),('broadcast_config','lower_third_text'),('broadcast_config','lower_third_auto'),
  ('ad_events','placement'),
  ('content_categories','display_name_ta'),
  ('otp_verifications','email'),
  ('rss_feeds','is_active'),
  ('freelancer_earnings','assignment_id')
),
-- ---- FUNCTIONS (regprocedure signature) -----------------------------------
fn(sig) as (values
  ('public.is_admin()'),
  ('public.configured_setting_keys()'),
  ('public.find_user_by_phone(text)'),
  ('public.set_platform_setting(text,text)'),
  ('public.set_email_opt_out(text,boolean)'),
  ('public.bump_feed_metric(uuid,text,integer)'),
  ('public.set_updated_at()'),
  ('public.stamp_feed_published_at()')
),
-- ---- POLICIES (table, policy name) — the security-critical / churny ones --
pol(tbl, name) as (values
  ('platform_settings','admin_all_settings'),
  ('otp_verifications','anon_insert_otp'),('otp_verifications','anon_verify_otp'),('otp_verifications','anon_consume_otp'),
  ('app_users','anon_create_appuser'),('sponsors','anon_create_sponsor'),('freelancers','anon_create_freelancer'),
  ('freelancers','auth_apply_freelancer'),('freelancers','auth_read_own_freelancer'),
  ('content_categories','pub_read_categories'),('content_categories','admin_manage_categories'),
  ('task_assignments','fl_read_own_assignments'),('freelancer_earnings','fl_read_own_earnings'),
  ('wallets','sponsor_rw_wallet'),('wallet_transactions','sponsor_rw_wallet_txn')
)
select * from (
  select 1 as ord, 'TABLE'   as kind, name as object, ''::text as note,
         case when to_regclass('public.'||name) is not null then 'PRESENT' else 'MISSING' end as status
  from tbl
  union all
  select 2, 'COLUMN', tbl||'.'||col, '',
         case when exists (select 1 from information_schema.columns
                where table_schema='public' and table_name=tbl and column_name=col)
              then 'PRESENT' else 'MISSING' end
  from col
  union all
  select 3, 'FUNCTION', sig, '',
         case when to_regprocedure(sig) is not null then 'PRESENT' else 'MISSING' end
  from fn
  union all
  select 4, 'POLICY', tbl||' / '||name, '',
         case when exists (select 1 from pg_policies
                where schemaname='public' and tablename=tbl and policyname=name)
              then 'PRESENT' else 'MISSING' end
  from pol
  union all
  -- Special: otp_verifications.phone must be NULLABLE (fix_email_otp.sql) or
  -- email-OTP inserts fail. Reports the actual nullability.
  select 5, 'NULLABLE', 'otp_verifications.phone',
         'expected YES after fix_email_otp.sql',
         coalesce((select is_nullable from information_schema.columns
            where table_schema='public' and table_name='otp_verifications' and column_name='phone'), 'NO COLUMN')
  from (select 1) x
) r
order by (status like 'PRESENT') , ord, object;  -- MISSING / unexpected first
