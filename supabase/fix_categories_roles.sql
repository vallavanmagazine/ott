-- ============================================================================
-- VALLAVAN — content categories (admin-managed) + freelancer content-access RLS.
-- Run ONCE in the Supabase SQL Editor. Re-runnable.
-- Depends on public.is_admin(), freelancers, task_assignments, app_users.
-- ============================================================================

-- FIX 4 — admin-managed categories (chips for Explore/Inspire/Feed).
CREATE TABLE IF NOT EXISTS content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,                 -- 'explore' | 'inspire' | 'feed'
  name text NOT NULL,                    -- stable key (matches content rows)
  display_name text NOT NULL,            -- shown on chips (renameable)
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(section, name)
);

INSERT INTO content_categories (section, name, display_name, sort_order)
SELECT * FROM (VALUES
  ('explore', 'Environment', 'Environment', 0),
  ('explore', 'Wildlife', 'Wildlife', 1),
  ('explore', 'History', 'History', 2),
  ('explore', 'Science', 'Science', 3),
  ('explore', 'Society', 'Society', 4),
  ('explore', 'Investigation', 'Investigation', 5),
  ('explore', 'Education', 'Education', 6),
  ('explore', 'Culture', 'Culture', 7),
  ('inspire', 'Motivation', 'Motivation', 0),
  ('inspire', 'Success Stories', 'Success Stories', 1),
  ('inspire', 'Life Lessons', 'Life Lessons', 2),
  ('inspire', 'Changemakers', 'Changemakers', 3),
  ('inspire', 'Youth Voices', 'Youth Voices', 4),
  ('feed', 'News', 'News', 0),
  ('feed', 'Teaser', 'Teaser', 1),
  ('feed', 'Short Story', 'Short Story', 2),
  ('feed', 'Other', 'Other', 3)
) v(section, name, display_name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM content_categories);

ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pub_read_categories ON content_categories;
CREATE POLICY pub_read_categories ON content_categories FOR SELECT USING (is_active OR public.is_admin());
DROP POLICY IF EXISTS admin_manage_categories ON content_categories;
CREATE POLICY admin_manage_categories ON content_categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FIX 6 — freelancer content access. Approved freelancers read open tasks and
-- their OWN assignments/earnings; they may update (submit) their own
-- assignments; they may NOT see other freelancers' rows. Admin sees all.
-- (freelancers self-read + open-tasks read already exist in section_f.sql.)
DROP POLICY IF EXISTS fl_read_own_assignments ON task_assignments;
CREATE POLICY fl_read_own_assignments ON task_assignments FOR SELECT TO authenticated
  USING (public.is_admin() OR freelancer_id IN (
    SELECT f.id FROM freelancers f
    JOIN app_users u ON u.id = f.user_id
    WHERE lower(u.email) = lower(auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS fl_update_own_assignments ON task_assignments;
CREATE POLICY fl_update_own_assignments ON task_assignments FOR UPDATE TO authenticated
  USING (public.is_admin() OR freelancer_id IN (
    SELECT f.id FROM freelancers f
    JOIN app_users u ON u.id = f.user_id
    WHERE lower(u.email) = lower(auth.jwt() ->> 'email')));

DROP POLICY IF EXISTS fl_read_own_earnings ON freelancer_earnings;
CREATE POLICY fl_read_own_earnings ON freelancer_earnings FOR SELECT TO authenticated
  USING (public.is_admin() OR freelancer_id IN (
    SELECT f.id FROM freelancers f
    JOIN app_users u ON u.id = f.user_id
    WHERE lower(u.email) = lower(auth.jwt() ->> 'email')));

-- Telecaller / Field Executive create campaigns + payment links on behalf of
-- sponsors: campaign/payment_link insert already allowed to authenticated by
-- section_f.sql admin/sponsor policies; ad_sales_log self-insert covered there.
