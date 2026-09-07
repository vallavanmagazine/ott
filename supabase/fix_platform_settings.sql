-- ============================================================================
-- VALLAVAN — fix "new row violates row-level security policy for
-- platform_settings" when an admin saves an API key.
--
-- Root cause: platform_settings used split INSERT/UPDATE RLS policies and the
-- client used upsert (INSERT ... ON CONFLICT DO UPDATE), which must satisfy
-- BOTH policies and fails hard if either is missing or if is_admin() is not
-- true at request time. Fix = a SECURITY DEFINER RPC that checks is_admin()
-- once and writes as the table owner (bypasses table RLS), plus a consolidated
-- FOR ALL policy as belt-and-suspenders. Run ONCE. Re-runnable.
-- Depends on public.is_admin() (rls_and_tables.sql).
-- ============================================================================

create table if not exists platform_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz default now()
);
alter table platform_settings enable row level security;

-- Consolidate to a single admin ALL policy (covers insert + update + delete).
drop policy if exists admin_insert_settings on platform_settings;
drop policy if exists admin_update_settings on platform_settings;
drop policy if exists admin_all_settings on platform_settings;
create policy admin_all_settings on platform_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- (still no SELECT-to-anon: values stay server-side; admins write via the RPC.)

-- Preferred write path: SECURITY DEFINER upsert, admin-guarded. The admin's
-- JWT rides the same authenticated client, is_admin() is evaluated inside, and
-- the write runs as the function owner so it can't be blocked by table-RLS.
create or replace function public.set_platform_setting(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required to change settings';
  end if;
  insert into platform_settings (key, value, updated_at)
  values (p_key, p_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = now();
end;
$$;

grant execute on function public.set_platform_setting(text, text) to authenticated;
