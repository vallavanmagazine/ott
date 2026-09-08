-- ============================================================================
-- VALLAVAN — phone login "No account found" fix.
--
-- Cause: accounts store phone as a BARE 10-digit number (client normPhone/_norm
-- strips non-digits + takes the last 10, e.g. 7550047567), but
-- find_user_by_phone compared with `u.phone = p` — an EXACT string match with
-- no normalization. Any row not perfectly bare-10 (an older build's +91, a
-- space, a leading 0) never matches, even for the right number.
--
-- Fix (same "normalize BOTH sides" principle used for the email OTP bug):
--   1. Repair existing rows to the canonical bare-10 format.
--   2. Recreate the RPC to compare the last-10-digits of BOTH the stored value
--      and the input, so it matches regardless of +91 / spaces / punctuation.
-- Canonical format = bare 10 digits (matches what Fast2SMS uses).
-- Run ONCE in the Supabase SQL Editor. Re-runnable.
-- ============================================================================

-- 1. Repair any legacy rows to bare 10-digit.
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

-- 2. Normalize both sides inside the lookup so format can never mismatch again.
create or replace function find_user_by_phone(p text)
returns table(id uuid, name text, email text, role text, phone text, sponsor_id uuid, freelancer_id uuid)
language sql security definer set search_path = public as $$
  select u.id, u.name, u.email, u.role::text, u.phone,
    (select s.id from sponsors s where s.owner_id = u.id or lower(s.email) = lower(u.email) limit 1),
    (select f.id from freelancers f where f.user_id = u.id or lower(f.email) = lower(u.email) limit 1)
  from app_users u
  where right(regexp_replace(coalesce(u.phone, ''), '[^0-9]', '', 'g'), 10)
      = right(regexp_replace(coalesce(p, ''),        '[^0-9]', '', 'g'), 10)
    and lower(coalesce(u.role::text, '')) in ('sponsor', 'freelancer')
  order by u.created_at desc nulls last
  limit 1;
$$;
grant execute on function find_user_by_phone(text) to anon, authenticated;

-- Diagnostic (run manually to see the stored value for the reported account):
--   select id, phone, role from app_users where phone like '%047567%';
-- If NO row comes back, the account was never created (an earlier
-- account-creation failure) — the user must register again; a login fix
-- cannot conjure a missing row.
