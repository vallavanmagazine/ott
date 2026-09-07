-- ============================================================================
-- VALLAVAN — email OTP support. otp_verifications gets an `email` column so
-- email verification codes are stored the same way as phone codes (same
-- code_hash / expires_at / consumed columns; email rows use purpose
-- 'email_verify'). Run ONCE. Re-runnable.
-- ============================================================================

ALTER TABLE otp_verifications ADD COLUMN IF NOT EXISTS email text;
CREATE INDEX IF NOT EXISTS otp_email_recent ON otp_verifications (email, created_at DESC);

-- The existing anon insert/select/consume policies on otp_verifications
-- (fix_phone_auth.sql) already cover email rows — no new policy needed.
