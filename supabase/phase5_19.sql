-- ============================================================================
-- VALLAVAN — Phases 5–19 SQL. Run ONCE in the Supabase SQL Editor.
-- Adds: platform_settings (server-only secrets), otp_verifications.
-- Depends on public.is_admin() from rls_and_tables.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- platform_settings — API keys / integration config.
-- SECURITY: admins may WRITE, but there is NO client SELECT policy, so secret
-- values are never returned to any browser. Only the NestJS service role
-- (which bypasses RLS) reads the values server-side. The admin UI learns which
-- keys are configured via configured_setting_keys() (names only, no values).
-- ---------------------------------------------------------------------------
create table if not exists platform_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);
alter table platform_settings enable row level security;

drop policy if exists admin_insert_settings on platform_settings;
create policy admin_insert_settings on platform_settings for insert to authenticated
  with check (public.is_admin());

drop policy if exists admin_update_settings on platform_settings;
create policy admin_update_settings on platform_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- (no SELECT / DELETE policy on purpose — values stay server-side)

-- Returns the NAMES of configured keys (never the values). Admin-guarded.
create or replace function public.configured_setting_keys()
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    return '{}';
  end if;
  return coalesce(
    (select array_agg(key order by key) from platform_settings
      where value is not null and value <> ''),
    '{}');
end;
$$;

-- ---------------------------------------------------------------------------
-- otp_verifications — Fast2SMS OTP flow (Phase 15). Codes written/verified by
-- the NestJS backend (service role). No client access.
-- ---------------------------------------------------------------------------
create table if not exists otp_verifications (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  code_hash  text not null,
  purpose    text default 'sponsor_login',
  consumed   boolean default false,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
create index if not exists otp_phone_idx on otp_verifications (phone, created_at desc);
alter table otp_verifications enable row level security;
-- no client policies — backend service role only.

-- ============================================================================
-- END phase5_19.sql
-- ============================================================================
