# VALLAVAN OTT — COMPLETE FINAL DISPATCH
# Execute EVERYTHING without stopping. Full authority. No approval gates.

---

## PROJECT: Vallavan OTT — Tamil Documentary Platform
## DOMAIN: vallavan.in
## SUPABASE: https://ipybmgkorxidxuqlptgj.supabase.co
## REPO: github.com/vallavanmagazine/ott (public)
## WEB BRANCH: backend-integration-dev
## FLUTTER BRANCH: flutter-app
## WEB DIR: C:\vallavan_new\project
## FLUTTER DIR: C:\vallavan_new\flutter_app

---

## RULES
1. NO push to main/master
2. NO touch SignBot or any other folder
3. NO live Razorpay charges — test mode only
4. NO real Meta API calls — stubs only
5. NO deploy to server — just build
6. MAY modify admin/sponsor/freelancer screens freely
7. MAY create new screens, components, services
8. MAY add database tables (output SQL)
9. Commit after each major section. Push after each branch.
10. BOTH web + Flutter must be updated

---

## WHAT EXISTS (do not redo)
- Web app deployed at vallavan.in
- Flutter app builds APK
- Supabase with schema + seed data
- Auth working (admin + sponsor)
- 20 viewer screens wired to Supabase
- Admin CRUD for documentaries, feed, inspire, live
- Video.js player with YouTube/HLS/MP4 support
- Broadcast overlay components (logo, ticker, lower third, weather)
- Ad engine with geo-targeting
- NestJS backend scaffold
- Playout service scaffold
- SEO Next.js scaffold

---

## OUTPUT ALL NEW SQL AT THE START
Before writing any code, output ALL new database tables and
alterations as a single SQL block for the user to run in Supabase.

---

# ═══════════════════════════════════════════════
# SECTION A: VIEWER EXPERIENCE FIXES
# ═══════════════════════════════════════════════

## A1: VIDEO PLAYER — INLINE (NOT FULLSCREEN)

Current bug: video player takes over entire screen, back button exits website.

Fix for EXPLORE + INSPIRE videos:
- Video plays INLINE within app layout
- Header stays visible at top
- Bottom navigation stays visible at bottom
- Video in 16:9 aspect ratio in middle
- Below video: title, synopsis, related content
- Back button → previous screen (React router, NOT browser history)
- Fullscreen button available → ONLY then go landscape
- Exit fullscreen → return to inline portrait view
- Never auto-rotate — only on user-triggered fullscreen

Fix for FEED reels:
- Keep current vertical reel format (9:16)
- NO rotation ever
- Swipe up/down snap-scroll
- Auto-play on scroll, muted by default

Navigation fix:
- Back/swipe-back NEVER exits the app
- If on Home and user presses back → do nothing
- Use React state/router for ALL navigation

## A2: MANDATORY ADS ON EVERY VIDEO

Every video must show ads. No video plays without ads.

Pre-roll (MANDATORY on ALL videos):
- 5-15 sec video/image ad from active campaigns
- "Skip Ad" button after 5 seconds
- Geo-targeted by viewer district
- Fallback: any active campaign → Vallavan house ad
- Track impression in ad_events

Mid-roll (on videos > 5 minutes):
- At 50% of duration
- Different ad than pre-roll (rotate)
- "Skip Ad" after 5 seconds
- Track impression

Post-roll (all videos):
- Sponsor card with CTA after content ends
- Track impression

Overlay strip ad (EXPLORE + INSPIRE only):
- After 30 seconds of playback: bottom strip overlay
- Semi-transparent banner with sponsor logo + headline + CTA
- Closable with X button
- Reappears every 90 seconds for 8 seconds
- Geo-targeted
- Track impressions + clicks

Feed strip ads:
- Strip ad card every 3 reels
- Banner ad every 5 reels
- Geo-targeted

ALL ads geo-targeted:
1. Detect district (IP geolocation → localStorage → manual select)
2. Filter active campaigns matching district
3. Fallback: statewide → any active → house ad
4. Rotate: least impressions first

## A3: CATEGORY FILTERS ON EVERY SECTION

FEED categories (horizontal scrollable chips):
  All | News | Teaser | Short Story | Entertainment

EXPLORE categories:
  All | Environment | Wildlife | History | Science | Society |
  Investigation | Education | Culture

INSPIRE categories:
  All | Motivation | Success Stories | Life Lessons |
  Changemakers | Youth Voices

Each chip filters content from database by content_type/genre/category.

## A4: BOTTOM NAVIGATION
- Solid dark background (#0A0A0A) matching header
- Always visible regardless of content behind
- Active tab: red icon + label

## A5: LIVE TV — COMING SOON MODE
- Remove "SOON" badge from nav icon
- "Coming Soon" only shows INSIDE the Live TV screen
- Controlled by broadcast_config.channel_live flag
- When channel_live = true → real player + overlay
- When channel_live = false → Coming Soon promo page

## A6: PROFILE SCREEN
- NO "Download" option
- NO "Admin Panel" link
- Active items: Watch History, Watch Later, App Settings,
  Help & Support, About Vallavan
- Sponsor section: "Become a Sponsor" or "Sponsor Dashboard"
- Freelancer section: "Join as Freelancer" or "Freelancer Dashboard"

# ═══════════════════════════════════════════════
# SECTION B: SPONSOR SYSTEM (complete)
# ═══════════════════════════════════════════════

## B1: SPONSOR PROMO PAGE

New screen: Profile → "Become a Sponsor"

Content:
- Hero: "Advertise on Vallavan — Tamil Nadu's Documentary Platform"
- Why Vallavan section (reach, geo-targeting, multi-platform)
- Pricing display:
  Display Ads: ₹99/day (1 district) to ₹799/day (all TN)
  Visible all day on app + social media + target impressions + CTA
  Inspire Video: ₹9,999 (10 min) / ₹25,000 (15 min + free magazine ad)
- Trusted sponsors section
- "Start Now" CTA buttons

## B2: SPONSOR SIGNUP (KYC)

Form fields:
- Business Name (required)
- Owner Name (required)
- Phone (required, OTP verified via Fast2SMS)
- Email (required)
- Business Type (dropdown: Restaurant, Shop, Service, Brand, Other)
- District (dropdown from districts table)
- GST Number (optional)
- Agree to Terms checkbox

Flow:
1. Fill form → Send OTP to phone
2. Verify OTP → Create app_users record (role: Sponsor)
3. Create sponsors record linked to app_users
4. Create Supabase Auth account
5. Redirect to Sponsor Dashboard

## B3: PAYMENT — RAZORPAY PAYMENT LINKS ONLY

NO in-app Razorpay checkout popup.
NO cash collection by team.
NO team paying on behalf of sponsor.
ONLY auto-generated Razorpay payment links shared to sponsor.

Use Razorpay Payment Links API:
  POST https://api.razorpay.com/v1/payment_links
  Auth: Basic with RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET
  Body: { amount (paise), currency: "INR", description,
         customer: { name, email, contact } }
  Response: { short_url, id }

When links are auto-generated:
1. Sponsor creates campaign with insufficient wallet → link generated
2. Wallet balance < ₹99 (campaign auto-pauses) → renewal link generated
3. Admin/freelancer clicks "Generate Top-up Link" → custom amount link

Minimum top-up: ₹999 (enforced everywhere)
Minimum wallet to start campaign: ₹999
Link expiry: 48 hours
Auto-reminder via SMS/email if unpaid after 24 hours

After payment detected (webhook or polling):
1. Credit wallet (+ bonus: ₹5K→10%, ₹10K→20%, ₹25K→30%)
2. Generate Invoice PDF (number, date, amount, GST, payment ID)
3. Generate Work Order PDF (service details, deliverables, terms)
4. Send both via email (Resend)
5. Store in invoices table
6. If campaign pending payment → auto-activate
7. Notify sponsor via SMS

Sharing options for payment link:
- Copy to clipboard
- Share via WhatsApp (deep link: whatsapp://send?text=...)
- Share via SMS
- Share via Email

## B4: WALLET SYSTEM

Top-up amounts shown: [₹999] [₹2,999] [₹4,999] [₹9,999] [Custom ≥₹999]

Bonuses:
  ₹999 - ₹4,999:     exact amount
  ₹5,000 - ₹9,999:   +10%
  ₹10,000 - ₹24,999: +20%
  ₹25,000+:           +30%

Daily deduction based on campaign coverage:
  1 district:     ₹99/day
  5 districts:    ₹199/day
  15 districts:   ₹399/day
  All 36 (TN):    ₹799/day

When wallet < ₹99: campaign auto-pauses, notification sent

## B5: AD CREATION

Two options:
1. AI Studio: describe business → AI generates headline/body/CTA
   Uses Anthropic API via backend
   Preview → Use This → save to ads table

2. Manual: upload image, fill headline/body/CTA/link
   Save to ads table

## B6: CAMPAIGN MANAGEMENT

Create → select ad creative → select districts → system shows daily rate
→ generate payment link (if wallet insufficient) → after payment → campaign active
→ daily wallet deduction → analytics tracking → low balance notification → top up

Campaign statuses: Draft → Pending Payment → Active → Paused → Ended

## B7: SPONSOR DASHBOARD

Tiles:
- Overview (active campaigns, wallet, impressions)
- My Campaigns (list with stats)
- Create Campaign
- AI Studio
- Creative Library (all their ads, edit/delete)
- Geo Targeting (district selector)
- Campaign Analytics (impressions, clicks, CTR, by district)
- Billing & Wallet (balance, transaction history, invoice downloads)
- Support

## B8: SPONSOR ANALYTICS

Show:
- Total impressions (app + social combined)
- CTA clicks + CTR
- Visibility status per platform (app/social)
- Wallet balance + estimated days remaining
- Top performing districts
- Daily spend breakdown
- Invoice history with PDF download

## B9: INSPIRE PR VIDEO SYSTEM

Two tiers:
₹9,999 (10 min):
  - Production by Vallavan team
  - Permanent on Inspire tab
  - Sponsor branded throughout (NO other ads in video)
  - ₹2,000 free wallet credit
  - Social media posts

₹25,000 (15 min):
  - Everything above PLUS:
  - Full page magazine ad FREE
  - All social media platforms
  - SMS + Email + WhatsApp blast
  - ₹5,000 free wallet credit
  - "Vallavan Recommends" badge

Inspire videos: is_sponsored = true, NO pre/mid/post roll from others.
Only show: "Presented by [Sponsor]" intro + sponsor logo throughout +
"A Vallavan Production" closing card.

# ═══════════════════════════════════════════════
# SECTION C: FREELANCER SYSTEM (complete)
# ═══════════════════════════════════════════════

## C1: CAREER PAGE

Profile → "Join as Freelancer"

Roles available:
- Reporter (field reporting, news gathering)
- Anchor (on-camera presentation)
- Writer (script writing, research)
- Visual Editor (video editing, color grading)
- Program Producer (project management)

Each role: description, requirements, pay range

"Apply Now" → application form:
- Full name, phone, email, district
- Role(s) applying for (multi-select)
- Experience years
- Portfolio URL, showreel URL
- Resume upload
- Terms agreement checkbox
- Submit → status: Pending

## C2: FREELANCER ENROLLMENT

After admin approves application:
1. Freelancer notified (SMS + email)
2. Pay ₹1,499 enrollment fee (Razorpay payment link)
3. After payment: account activated
4. Gets Freelancer Dashboard access
5. Can: pick tasks, submit content, resell magazine, sell ads

## C3: FREELANCER DASHBOARD

Tiles:
- Available Tasks (browse open tasks)
- My Assignments (active work)
- Submit Content (upload deliverables)
- Earnings & Payments
- Magazine Reseller
- Ad Sales Commission
- Sponsor Management (generate campaigns + payment links for sponsors)
- My Profile & Documents
- Terms & Conditions

## C4: TASK SYSTEM

Content types with specifications:
- FEED (1-3 min): news, events, current affairs + voiceover + visual edit
- EXPLORE (15-30 min): investigative/cinematic documentary, single project only
- INSPIRE (10-15 min): bio-pic, sponsor content, interview

Each task shows: content type, title, roles needed, pay per role,
deadline, location, status

Freelancer picks task → assigned → works → submits content → admin reviews
→ approved → published → payment released

Task statuses: Open → Assigned → In Progress → Submitted → Under Review
→ Approved/Revision Needed → Published → Paid

## C5: CONTENT SUBMISSION

Freelancer submits:
- Select assignment
- Upload video (URL or file)
- Upload thumbnail
- Title, description
- Submit for review

Admin reviews → approves → content published to app → payment released

## C6: EARNINGS

Types:
- Project payment (per task, role-based pricing)
- Magazine resale commission (20% of ₹20 = ₹4 per copy)
- Ad sales commission (20% of ad revenue brought in)

Payment via UPI/bank transfer after admin approval

## C7: MAGAZINE RESELLER

Buy at dealer price (₹14) → sell at ₹20
Order copies, track sales, earn commission
20% commission per sale

## C8: AD SALES BY FREELANCER

Freelancer can generate campaigns + payment links for sponsors
When sponsor pays through freelancer's link → freelancer gets 20% commission
Track: business name, sale amount, commission, verification status

# ═══════════════════════════════════════════════
# SECTION D: ADMIN DASHBOARD (complete)
# ═══════════════════════════════════════════════

## D1: ADMIN DASHBOARD HOME (fully dynamic)
All numbers from real database:
- Users count, Documentaries count, Active sponsors count
- Revenue (SUM wallet top-ups), Views, Clicks, CTR
- Revenue chart (from wallet_transactions by week)
- Recent activity (last 10 audit_logs)

## D2: CONTENT CMS

Documentaries CRUD: full form with ALL fields including video_url
Feed Content CRUD: full form, "News" type auto-creates ticker item
Live TV CRUD: full form with video_url, ad insert points
Inspire Content CRUD: full form, sponsored flag
Categories view: genre/category counts

Every form has video_url field where admin pastes
YouTube/DyneTube/HLS/MP4 URL

## D3: BROADCAST CONTROL PANEL

All toggles save to broadcast_config via Supabase:
- Channel bug: on/off, position, opacity
- Lower third: on/off, auto/custom
- News ticker: on/off, speed, manual items, RSS feed URLs
- L-Band: on/off, select sponsor
- Breaking news: headline, activate/deactivate
- Weather: on/off, city
- Powered by: on/off, select sponsor
- Channel live: GO LIVE / GO OFFLINE toggle

## D4: SPONSOR MANAGEMENT (admin side)

- View all sponsors with wallet balance
- Create campaign on behalf of sponsor
- Generate Razorpay payment link for sponsor (shareable)
- View payment history per sponsor
- Approve/reject campaigns
- Download invoices/work orders

## D5: FREELANCER MANAGEMENT (admin side)

- Review applications (approve/reject)
- Create tasks with role assignments and pricing
- Review submitted content (approve/request revision)
- Release payments
- Track magazine orders
- Verify ad sales commissions

## D6: SOCIAL MEDIA MANAGER

Admin screen for posting to social media:
- Create post: select Vallavan content + auto-embed active sponsor ad
- Platform selection: FB, Insta, X, YouTube, WhatsApp
- Preview formatted post
- Post now or schedule (date + time picker)
- Auto-queue: system matches content + ads, admin approves
- Schedule templates: daily at 10AM, 2PM, 6PM, 8PM
- Track which posts went out

Auto-fetch ads mode:
- System picks today's content + matching active campaign
- Creates ready-to-post social media content
- Admin reviews queue → one-click approve + post

## D7: INVOICE MANAGEMENT

- View all invoices
- Download invoice/work order PDFs
- Resend via email
- Filter by sponsor, date, amount

## D8: API SETTINGS

Admin → System Settings → API Configuration:
- RAZORPAY_KEY_ID / SECRET (stored in platform_settings, encrypted)
- ANTHROPIC_API_KEY
- RESEND_API_KEY
- FAST2SMS_API_KEY
- WHATSAPP_API_KEY
- FIREBASE keys
- DYNETUBE_API_KEY
- Show which keys are configured (names only, never values)

## D9: ANALYTICS & REPORTS

- Platform-wide analytics (users, views, revenue)
- Per-campaign performance
- Geo breakdown (which districts, which ads)
- Revenue per sponsor
- Freelancer productivity metrics
- Monthly report generator (PDF)

# ═══════════════════════════════════════════════
# SECTION E: INTEGRATIONS
# ═══════════════════════════════════════════════

## E1: RAZORPAY (payment links API — test mode)
Payment link generation for wallet top-ups
Webhook/polling for payment confirmation
Invoice auto-generation after payment

## E2: FAST2SMS (OTP)
Sponsor signup OTP verification
Freelancer signup OTP
Payment reminders
Campaign notifications

## E3: RESEND (email)
Invoice + work order delivery
Welcome emails
Campaign approval/rejection notifications
Weekly sponsor analytics summary
Freelancer task notifications

## E4: ANTHROPIC API (AI Studio)
Ad creative generation from text description
Headline/body/CTA suggestions
Used via NestJS backend (never exposed to client)

## E5: DYNETUBE API (video hosting)
Admin upload video → DyneTube API → returns HLS URL
Save URL to video_url field
List/delete videos from DyneTube
Future: live streaming via DyneTube

## E6: META SOCIAL (stubs only)
Facebook page posting (stub)
Instagram posting (stub)
DO NOT make real API calls

## E7: WHATSAPP API
Payment link sharing
Campaign notifications
Subscriber broadcasts

## E8: FIREBASE
Push notifications for mobile app
New content alerts
Campaign status updates

# ═══════════════════════════════════════════════
# SECTION F: DATABASE — OUTPUT ALL SQL
# ═══════════════════════════════════════════════

Output ALL of these as one SQL block at the start:

```sql
-- Pricing
CREATE TABLE IF NOT EXISTS pricing_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coverage text NOT NULL,
  districts_count int NOT NULL,
  daily_rate_paise int NOT NULL,
  is_active boolean DEFAULT true
);

INSERT INTO pricing_rates (coverage, districts_count, daily_rate_paise) VALUES
('1 District', 1, 9900),
('5 Districts', 5, 19900),
('15 Districts', 15, 39900),
('All Tamil Nadu', 36, 79900);

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

INSERT INTO inspire_packages (name, price_paise, production_cost_paise, video_duration_min, free_wallet_credit_paise, includes_magazine) VALUES
('Spotlight', 999900, 400000, 10, 200000, false),
('Prestige', 2500000, 1000000, 15, 500000, true);

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

-- Public read on pricing
CREATE POLICY pub_read_pricing ON pricing_rates FOR SELECT USING (true);
CREATE POLICY pub_read_inspire_pkg ON inspire_packages FOR SELECT USING (true);

-- Admin full access on all new tables
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['payment_links','invoices','social_posts',
    'freelancers','freelancer_tasks','task_assignments','freelancer_earnings',
    'magazine_orders','ad_sales_log','inspire_orders','pricing_rates',
    'inspire_packages'] LOOP
    EXECUTE format('CREATE POLICY admin_all_%1$s ON %1$I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', t);
  END LOOP;
END $$;
```

# ═══════════════════════════════════════════════
# SECTION G: BUILD INSTRUCTIONS
# ═══════════════════════════════════════════════

## WEB APP
Update all files in C:\vallavan_new\project
npm run typecheck
npm run build
Commit + push to backend-integration-dev

## FLUTTER APP
Update all files in C:\vallavan_new\flutter_app
flutter analyze
flutter build apk --release \
  --dart-define="SUPABASE_URL=https://ipybmgkorxidxuqlptgj.supabase.co" \
  --dart-define="SUPABASE_ANON_KEY=READ_FROM_PROJECT_ENV"
Commit + push to flutter-app

## AFTER ALL COMPLETE — REPORT:
1. List ALL new files created
2. List ALL files modified
3. ALL SQL needed (one block)
4. ALL .env variables needed
5. Build output (sizes, modules)
6. Known issues or limitations
7. Deploy instructions

# ═══════════════════════════════════════════════
# START NOW. Execute everything without stopping.
# ═══════════════════════════════════════════════
