-- ============================================================================
-- VALLAVAN — Section F: sponsor payments, invoices, social, freelancer system,
-- inspire packages/orders. Run ONCE in the Supabase SQL Editor.
-- Depends on public.is_admin() (rls_and_tables.sql) + sponsors/app_users/ads/inspire_items.
-- Policy creations are guarded with DROP IF EXISTS so this is re-runnable.
-- ============================================================================

-- Pricing
CREATE TABLE IF NOT EXISTS pricing_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage text NOT NULL,
  districts_count int NOT NULL,
  daily_rate_paise int NOT NULL,
  is_active boolean DEFAULT true
);

INSERT INTO pricing_rates (coverage, districts_count, daily_rate_paise)
SELECT * FROM (VALUES
  ('1 District', 1, 9900),
  ('5 Districts', 5, 19900),
  ('15 Districts', 15, 39900),
  ('All Tamil Nadu', 36, 79900)
) v(coverage, districts_count, daily_rate_paise)
WHERE NOT EXISTS (SELECT 1 FROM pricing_rates);

-- Inspire packages
CREATE TABLE IF NOT EXISTS inspire_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_paise int NOT NULL,
  production_cost_paise int NOT NULL,
  video_duration_min int NOT NULL,
  free_wallet_credit_paise int DEFAULT 0,
  includes_magazine boolean DEFAULT false,
  description text,
  is_active boolean DEFAULT true
);

INSERT INTO inspire_packages (name, price_paise, production_cost_paise, video_duration_min, free_wallet_credit_paise, includes_magazine)
SELECT * FROM (VALUES
  ('Spotlight', 999900, 400000, 10, 200000, false),
  ('Prestige', 2500000, 1000000, 15, 500000, true)
) v(name, price_paise, production_cost_paise, video_duration_min, free_wallet_credit_paise, includes_magazine)
WHERE NOT EXISTS (SELECT 1 FROM inspire_packages);

-- Payment links
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES sponsors(id),
  amount_paise int NOT NULL,
  razorpay_link_id text,
  razorpay_short_url text,
  purpose text DEFAULT 'wallet_topup',
  status text DEFAULT 'created',
  paid_at timestamptz,
  created_by uuid,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES sponsors(id),
  invoice_number text NOT NULL UNIQUE,
  type text DEFAULT 'wallet_topup',
  amount_paise int NOT NULL,
  gst_paise int DEFAULT 0,
  total_paise int NOT NULL,
  razorpay_payment_id text,
  pdf_url text,
  work_order_url text,
  sent_via_email boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Social posts
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text,
  content_id uuid,
  caption text NOT NULL,
  platforms text[] NOT NULL,
  embedded_ad_id uuid REFERENCES ads(id),
  status text DEFAULT 'draft',
  scheduled_at timestamptz,
  posted_at timestamptz,
  post_urls jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Freelancers
CREATE TABLE IF NOT EXISTS freelancers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_users(id),
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  district text,
  roles text[] NOT NULL,
  experience_years int DEFAULT 0,
  portfolio_url text,
  resume_url text,
  showreel_url text,
  status text DEFAULT 'pending',
  subscription_paid boolean DEFAULT false,
  subscription_paid_at timestamptz,
  total_earned_paise int DEFAULT 0,
  joined_at timestamptz DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS freelancer_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content_type text NOT NULL,
  roles_needed text[] NOT NULL,
  pay_per_role jsonb DEFAULT '{}',
  deadline timestamptz,
  location text,
  status text DEFAULT 'open',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Task assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES freelancer_tasks(id),
  freelancer_id uuid REFERENCES freelancers(id),
  role text NOT NULL,
  status text DEFAULT 'assigned',
  submitted_at timestamptz,
  approved_at timestamptz,
  paid_at timestamptz,
  payment_amount_paise int,
  content_url text,
  thumbnail_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Freelancer earnings
CREATE TABLE IF NOT EXISTS freelancer_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid REFERENCES freelancers(id),
  type text NOT NULL,
  amount_paise int NOT NULL,
  description text,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Magazine orders
CREATE TABLE IF NOT EXISTS magazine_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid REFERENCES freelancers(id),
  quantity int NOT NULL,
  unit_price_paise int DEFAULT 1400,
  total_paise int NOT NULL,
  status text DEFAULT 'ordered',
  created_at timestamptz DEFAULT now()
);

-- Ad sales by freelancers
CREATE TABLE IF NOT EXISTS ad_sales_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id uuid REFERENCES freelancers(id),
  business_name text NOT NULL,
  sale_amount_paise int NOT NULL,
  commission_paise int NOT NULL,
  commission_rate decimal DEFAULT 0.20,
  status text DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Inspire orders
CREATE TABLE IF NOT EXISTS inspire_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id uuid REFERENCES sponsors(id),
  package_id uuid REFERENCES inspire_packages(id),
  inspire_item_id uuid REFERENCES inspire_items(id),
  status text DEFAULT 'ordered',
  production_status text DEFAULT 'pending',
  paid_paise int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Sponsor fields
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS gst_number text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS district text;

-- Wallet fields (bonus tracking / low-balance auto-pause support)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS daily_rate_paise int DEFAULT 9900;

-- Inspire sponsored flags
ALTER TABLE inspire_items ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;
ALTER TABLE inspire_items ADD COLUMN IF NOT EXISTS sponsor_id uuid REFERENCES sponsors(id);
ALTER TABLE inspire_items ADD COLUMN IF NOT EXISTS sponsor_logo_url text;

-- RLS for all new tables
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE magazine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sales_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspire_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspire_packages ENABLE ROW LEVEL SECURITY;

-- Public read on pricing + open freelancer tasks
DROP POLICY IF EXISTS pub_read_pricing ON pricing_rates;
CREATE POLICY pub_read_pricing ON pricing_rates FOR SELECT USING (true);
DROP POLICY IF EXISTS pub_read_inspire_pkg ON inspire_packages;
CREATE POLICY pub_read_inspire_pkg ON inspire_packages FOR SELECT USING (true);
DROP POLICY IF EXISTS pub_read_open_tasks ON freelancer_tasks;
CREATE POLICY pub_read_open_tasks ON freelancer_tasks FOR SELECT USING (status = 'open' OR public.is_admin());

-- Freelancer applications: anyone signed-in may insert their application; read own.
DROP POLICY IF EXISTS auth_apply_freelancer ON freelancers;
CREATE POLICY auth_apply_freelancer ON freelancers FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS auth_read_own_freelancer ON freelancers;
CREATE POLICY auth_read_own_freelancer ON freelancers FOR SELECT TO authenticated
  USING (public.is_admin() OR user_id IN (select id from app_users where lower(email) = lower(auth.jwt() ->> 'email')));

-- Self-service registration (sponsor/freelancer signup). A user who just
-- verified their email OTP is authenticated and must be able to create their
-- own app_users + sponsors rows. (freelancers self-insert already allowed above.)
DROP POLICY IF EXISTS auth_insert_own_appuser ON app_users;
CREATE POLICY auth_insert_own_appuser ON app_users FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email') OR public.is_admin());
DROP POLICY IF EXISTS auth_update_own_appuser ON app_users;
CREATE POLICY auth_update_own_appuser ON app_users FOR UPDATE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email') OR public.is_admin());

DROP POLICY IF EXISTS auth_insert_own_sponsor ON sponsors;
CREATE POLICY auth_insert_own_sponsor ON sponsors FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email') OR public.is_admin());
DROP POLICY IF EXISTS auth_update_own_sponsor ON sponsors;
CREATE POLICY auth_update_own_sponsor ON sponsors FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email') OR public.is_admin());

-- Admin full access on all new tables
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['payment_links','invoices','social_posts',
    'freelancers','freelancer_tasks','task_assignments','freelancer_earnings',
    'magazine_orders','ad_sales_log','inspire_orders','pricing_rates',
    'inspire_packages'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS admin_all_%1$s ON %1$I;', t);
    EXECUTE format('CREATE POLICY admin_all_%1$s ON %1$I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', t);
  END LOOP;
END $$;
