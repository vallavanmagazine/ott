-- ============================================================================
-- Vallavan OTT — Supabase Postgres schema (DRAFT, Phase 1)
-- Derived field-for-field from src/data/mockData.ts.
-- Money is stored as integer paise (bigint); display strings (duration "24:18",
-- uploaded "Aug 10, 2024") are DERIVED in the service layer, not stored.
-- Apply with: psql "$DATABASE_URL" -f supabase/schema.sql  (or Supabase SQL editor)
-- ============================================================================

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums (values match the exact string literals the UI compares against)
-- ---------------------------------------------------------------------------
create type genre_type as enum (
  'Environment','Wildlife','History','Science','Society','Investigation',
  'Education','Culture','Motivation','Success Stories','Life Lessons',
  'Changemakers','Youth Voices'
);

create type content_status as enum ('Published','Draft');           -- documentaries
create type feed_status    as enum ('Published','Draft','Scheduled'); -- feed reels
create type feed_content_type as enum ('News','Teaser','Short Story','Other');
create type campaign_status as enum ('Draft','Pending Approval','Active','Paused','Ended');
create type user_role      as enum ('Viewer','Sponsor','Creator','Admin');
create type user_status    as enum ('Active','Suspended','Pending');
create type sponsor_status as enum ('Active','Pending','Suspended');
create type notification_type as enum ('episode','live','sponsor','system');

-- ---------------------------------------------------------------------------
-- CONTENT
-- ---------------------------------------------------------------------------

-- Documentary  (mockData.ts: interface Documentary) — also backs adminDocumentaries
create table documentaries (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  title_ta     text not null,               -- titleTa
  genre        genre_type not null,
  duration_sec integer not null,            -- duration ("24:18") derived; durationSec passthrough
  poster       text not null,               -- Storage URL or Pexels id (pexelsUrl tolerates both)
  backdrop     text not null,
  year         integer not null,
  language     text not null,
  synopsis     text not null,
  synopsis_ta  text not null,               -- synopsisTa
  badge        text,                        -- 'FEATURED' | 'NEW' | ... (nullable)
  progress     numeric(4,3),                -- 0.000..1.000 (nullable) — per-content demo value
  exclusive    boolean not null default false,
  director     text,
  "cast"       text[] ,                     -- cast?: string[]
  status       content_status not null default 'Published',
  views        integer not null default 0,  -- adminDocumentaries.views
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),  -- adminDocumentaries.uploaded (derived)
  updated_at   timestamptz not null default now()
);
create index on documentaries (genre);
create index on documentaries (status);
create index on documentaries (badge);

-- InspireItem
create table inspire_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  title_ta     text not null,
  category     text not null,               -- Changemakers / Success Stories / Motivation / ...
  duration_sec integer not null,            -- duration ("06:24") derived
  poster       text not null,
  quote        text,
  attribution  text,
  badge        text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index on inspire_items (category);

-- LiveSlot
create table live_slots (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  title_ta      text not null,
  description   text not null,
  thumb         text not null,
  start_time24  text not null,              -- time24 "18:00"; 12h "06:00 PM" derived
  duration_min  integer not null,           -- duration "30 min" derived
  is_live       boolean not null default false,
  air_date      date not null default current_date,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index on live_slots (air_date, sort_order);

-- FeedReel
create table feed_reels (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  title_ta         text not null,
  caption          text not null,
  caption_ta       text not null,
  creator          text not null,
  creator_handle   text not null,           -- '@vallavannews'
  content_type     feed_content_type not null,
  genre            genre_type not null,
  duration_sec     integer not null,        -- duration "0:45" derived
  thumb            text not null,
  likes            integer not null default 0,
  comments         integer not null default 0,
  shares           integer not null default 0,
  views            integer not null default 0,
  status           feed_status not null default 'Published',
  strip_ad_host    boolean not null default false,
  banner_after     boolean not null default false,
  attached_campaign uuid,                    -- FK added after campaigns table (see note); nullable
  sort_order       integer not null default 0,   -- "order"
  created_at       timestamptz not null default now()  -- uploaded ("Aug 10, 2024") derived
);
create index on feed_reels (sort_order);
create index on feed_reels (status);
-- NOTE: mock attachedCampaign is a campaign NAME string. Service resolves the
-- name for display; column stores the FK. Nullable when no campaign attached.

-- ---------------------------------------------------------------------------
-- SPONSORS / USERS / CAMPAIGNS / ADS
-- ---------------------------------------------------------------------------

-- App users (adminUsers). Linked to Supabase auth.users by auth_id when they log in.
create table app_users (
  id         uuid primary key default gen_random_uuid(),
  auth_id    uuid unique,                   -- references auth.users(id) once authenticated
  name       text not null,
  email      text not null unique,
  role       user_role not null default 'Viewer',
  status     user_status not null default 'Active',
  created_at timestamptz not null default now()  -- joined ("Jan 2024") derived
);

-- Sponsors (adminSponsors). A sponsor is an advertiser org.
create table sponsors (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references app_users(id) on delete set null,
  name       text not null,
  email      text,
  status     sponsor_status not null default 'Pending',
  created_at timestamptz not null default now()  -- joined derived
  -- campaigns(count) & spend are aggregated from campaigns table for adminSponsors
);

-- Campaigns (campaigns[] + adminPendingCampaigns projection)
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  sponsor_id    uuid not null references sponsors(id) on delete cascade,
  name          text not null,
  status        campaign_status not null default 'Draft',
  impressions   integer not null default 0,
  clicks        integer not null default 0,
  spend_paise   bigint  not null default 0,   -- campaigns.spend (rupees) = spend_paise/100
  budget_paise  bigint  not null default 0,   -- adminPendingCampaigns.budget
  start_date    date,                          -- startDate "Jul 15, 2024"
  submitted_at  timestamptz,                   -- adminPendingCampaigns.submitted
  created_at    timestamptz not null default now()
);
create index on campaigns (sponsor_id);
create index on campaigns (status);

-- Deferred FK: feed_reels.attached_campaign → campaigns (campaigns now exists)
alter table feed_reels
  add constraint feed_reels_attached_campaign_fkey
  foreign key (attached_campaign) references campaigns(id) on delete set null;

-- Campaign geo-target (Tamil Nadu districts)
create table districts (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique                   -- tamilNaduDistricts entries
);
create table campaign_districts (
  campaign_id uuid references campaigns(id) on delete cascade,
  district_id uuid references districts(id) on delete cascade,
  primary key (campaign_id, district_id)
);

-- Ad creatives (AdContent). Owned by a sponsor/campaign in later phases.
create table ads (
  id          uuid primary key default gen_random_uuid(),
  sponsor     text not null,                  -- display name (AdContent.sponsor)
  sponsor_id  uuid references sponsors(id) on delete set null,
  sponsor_logo text not null default '',      -- sponsorLogo
  headline    text not null,
  body        text not null,
  cta         text not null,
  bg_image    text not null,                  -- bgImage
  accent      text not null,                  -- hex color
  campaign_id uuid references campaigns(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Ad placements (adminAdPlacements)
create table ad_placements (
  id          uuid primary key default gen_random_uuid(),
  sponsor     text not null,
  ad_id       uuid references ads(id) on delete set null,
  placement   text not null,                  -- 'Home Banner #1', 'Video Pre-roll', ...
  impressions integer not null default 0,
  status      text not null default 'Live',
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SYSTEM
-- ---------------------------------------------------------------------------

-- Notifications (notifications[])
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  type       notification_type not null,
  title      text not null,
  title_ta   text,
  body       text not null,
  unread     boolean not null default true,   -- global flag for now (viewers are local)
  created_at timestamptz not null default now()  -- time ("2 min ago") derived
);

-- Audit logs (adminAuditLogs) — one row per admin mutation
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor      text not null,                   -- 'admin@vallavan' / user email
  actor_id   uuid references app_users(id) on delete set null,
  action     text not null,                   -- 'Approved campaign "..."'
  created_at timestamptz not null default now()  -- time ("Aug 05, 14:32") derived
);

-- Trending searches (trendingSearches). recentSearches stays client-local.
create table trending_searches (
  id         uuid primary key default gen_random_uuid(),
  term       text not null,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- PHASE 2 PLACEHOLDERS (wallet / pricing) — created now, used later.
-- Amounts in paise. Pricing formula is a BLOCKER (B1); values are placeholders.
-- ---------------------------------------------------------------------------
create table wallets (
  sponsor_id    uuid primary key references sponsors(id) on delete cascade,
  balance_paise bigint not null default 0,
  updated_at    timestamptz not null default now()
);

create table wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  sponsor_id    uuid not null references sponsors(id) on delete cascade,
  amount_paise  bigint not null,              -- +credit (top-up) / -debit (per-post)
  kind          text not null,               -- 'topup' | 'post_charge' | 'refund'
  reference     text,                        -- razorpay id / post id (idempotency key)
  created_at    timestamptz not null default now(),
  unique (kind, reference)                    -- idempotent per-post / per-payment
);

create table pricing_config (
  id                 uuid primary key default gen_random_uuid(),
  base_post_paise    bigint not null default 0,   -- TODO(pricing): confirm with Murugavel (B1)
  per_district_paise bigint not null default 0,
  bill_dual_as_single boolean not null default false, -- B2 toggle
  updated_at         timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public (anon) may read PUBLISHED content only. All writes go through the
-- NestJS service role (bypasses RLS) or narrowly-scoped sponsor policies.
-- ============================================================================
alter table documentaries    enable row level security;
alter table inspire_items    enable row level security;
alter table live_slots       enable row level security;
alter table feed_reels       enable row level security;
alter table ads              enable row level security;
alter table ad_placements    enable row level security;
alter table notifications    enable row level security;
alter table districts        enable row level security;
alter table trending_searches enable row level security;
alter table campaigns        enable row level security;
alter table sponsors         enable row level security;
alter table app_users        enable row level security;
alter table audit_logs       enable row level security;
alter table wallets          enable row level security;
alter table wallet_transactions enable row level security;

-- Public read policies (published content + reference data)
create policy pub_read_docs    on documentaries for select using (status = 'Published');
create policy pub_read_inspire on inspire_items for select using (true);
create policy pub_read_live    on live_slots    for select using (true);
create policy pub_read_feed    on feed_reels    for select using (status = 'Published');
create policy pub_read_ads     on ads           for select using (true);
create policy pub_read_places  on ad_placements for select using (true);
create policy pub_read_notif   on notifications for select using (true);
create policy pub_read_districts on districts   for select using (true);
create policy pub_read_trending on trending_searches for select using (true);

-- Sponsor-scoped reads of their own campaigns/sponsor row (once viewer/sponsor auth wired)
create policy sponsor_read_own_campaigns on campaigns for select
  using (sponsor_id in (select id from sponsors where owner_id = auth.uid()));
create policy sponsor_read_own_sponsor on sponsors for select
  using (owner_id = auth.uid());

-- NOTE: no insert/update/delete policies defined here → denied to anon &
-- authenticated by default. Mutations run via NestJS with the service-role key,
-- or via explicit admin policies added when admin auth lands.

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger trg_docs_updated before update on documentaries
  for each row execute function set_updated_at();
