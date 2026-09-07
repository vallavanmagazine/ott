-- ============================================================================
-- VALLAVAN — email consent for newsletter/promotional. Transactional emails
-- (welcome, invoice, receipts) ignore this flag; marketing respects it.
-- Run ONCE. Re-runnable.
-- ============================================================================

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS email_opt_out boolean DEFAULT false;

-- Public unsubscribe (called from the footer link handler). SECURITY DEFINER so
-- an anonymous click can set the flag without a broad UPDATE policy.
CREATE OR REPLACE FUNCTION set_email_opt_out(p_email text, p_out boolean)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE app_users SET email_opt_out = p_out WHERE lower(email) = lower(p_email);
$$;
GRANT EXECUTE ON FUNCTION set_email_opt_out(text, boolean) TO anon, authenticated;
