-- ============================================================================
-- VALLAVAN — phone + OTP auth for sponsor/freelancer (NO Supabase Auth).
-- Accounts are created directly from the (anon) client. DEV-MODE: this opens
-- anon INSERT on the account tables and anon access to otp_verifications.
-- Supabase Auth remains ONLY for admin login. Run ONCE. Re-runnable.
-- ============================================================================

-- 11. phone column on app_users
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone text;

-- 4. recent-OTP lookup index
CREATE INDEX IF NOT EXISTS otp_phone_recent ON otp_verifications (phone, created_at DESC);

-- 3. otp_verifications: anon insert / select / consume (dev-mode client OTP)
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_insert_otp ON otp_verifications;
CREATE POLICY anon_insert_otp ON otp_verifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_verify_otp ON otp_verifications;
CREATE POLICY anon_verify_otp ON otp_verifications FOR SELECT USING (true);
DROP POLICY IF EXISTS anon_consume_otp ON otp_verifications;
CREATE POLICY anon_consume_otp ON otp_verifications FOR UPDATE USING (true) WITH CHECK (true);

-- Account creation from the anon client (dev-mode). Ids are generated client
-- side, so no SELECT-back is needed on these tables.
DROP POLICY IF EXISTS anon_create_appuser ON app_users;
CREATE POLICY anon_create_appuser ON app_users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_create_sponsor ON sponsors;
CREATE POLICY anon_create_sponsor ON sponsors FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS anon_create_freelancer ON freelancers;
CREATE POLICY anon_create_freelancer ON freelancers FOR INSERT WITH CHECK (true);

-- 7. Login lookup by phone — SECURITY DEFINER so we do NOT expose all of
-- app_users to anon. Returns only the row for that phone + its linked ids.
CREATE OR REPLACE FUNCTION find_user_by_phone(p text)
RETURNS TABLE(id uuid, name text, email text, role text, phone text, sponsor_id uuid, freelancer_id uuid)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.name, u.email, u.role, u.phone,
    (SELECT s.id FROM sponsors s WHERE s.owner_id = u.id OR lower(s.email) = lower(u.email) LIMIT 1),
    (SELECT f.id FROM freelancers f WHERE f.user_id = u.id OR lower(f.email) = lower(u.email) LIMIT 1)
  FROM app_users u
  WHERE u.phone = p AND lower(coalesce(u.role, '')) IN ('sponsor', 'freelancer')
  ORDER BY u.created_at DESC NULLS LAST
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION find_user_by_phone(text) TO anon, authenticated;
