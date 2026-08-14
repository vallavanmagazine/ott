-- Vallavan OTT — Seed Data
-- Reproduces every item from src/data/mockData.ts
-- Run after schema.sql on a fresh Supabase project

-- Helper: Pexels URL pattern used in mockData
-- px(id, w) = https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w={w}

-- =============================================================================
-- DISTRICTS (tamilNaduDistricts array)
-- =============================================================================

INSERT INTO districts (name, sort_order) VALUES
  ('Chennai', 1), ('Coimbatore', 2), ('Madurai', 3), ('Tiruchirappalli', 4),
  ('Salem', 5), ('Tirunelveli', 6), ('Tiruppur', 7), ('Vellore', 8),
  ('Erode', 9), ('Thoothukudi', 10), ('Dindigul', 11), ('Thanjavur', 12),
  ('Ramanathapuram', 13), ('Sivaganga', 14), ('Karur', 15), ('Kanchipuram', 16),
  ('Tiruvallur', 17), ('Nagapattinam', 18), ('Cuddalore', 19), ('Viluppuram', 20),
  ('Namakkal', 21), ('Dharmapuri', 22), ('Krishnagiri', 23), ('Virudhunagar', 24),
  ('Theni', 25), ('Nilgiris', 26), ('Tiruvarur', 27), ('Ariyalur', 28),
  ('Perambalur', 29), ('Pudukkottai', 30), ('Sivakasi', 31), ('Kanyakumari', 32),
  ('Tenkasi', 33), ('Tirupathur', 34), ('Chengalpattu', 35), ('Kallakurichi', 36);

-- =============================================================================
-- DOCUMENTARIES (documentaries array — 12 items)
-- =============================================================================

INSERT INTO documentaries (id, title, title_ta, genre, duration_sec, poster, backdrop, year, language, synopsis, synopsis_ta, badge, progress, exclusive, director, cast_members, status, views) VALUES
  ('d1', 'The Last Mangroves', 'கடைசி சதுப்பு நிலங்கள்', 'Environment', 1458,
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'Tamil',
   'A deep dive into the vanishing mangrove forests of the Tamil Nadu coast and the fisherfolk fighting to save them.',
   'தமிழக கடற்கரையில் அழிந்து வரும் சதுப்பு நிலங்கள் மற்றும் அவற்றைக் காப்பாற்ற போராடும் மீனவர்கள் பற்றிய ஆழமான பார்வை.',
   'FEATURED', NULL, false, 'Karthik Raman', ARRAY['M. Selvan', 'Lakshmi Rao'], 'Published', 24500),

  ('d2', 'Tigers of Anamalai', 'ஆனைமலை புலிகள்', 'Wildlife', 1965,
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'Tamil',
   'Tracking the elusive Bengal tigers through the misty hills of the Anamalai Tiger Reserve.',
   'ஆனைமலை புலி காப்பகத்தின் மூடுபனி மலைகளில் மறைந்திருக்கும் பெங்கால் புலிகளைத் தேடி.',
   'NEW', NULL, false, NULL, ARRAY[]::text[], 'Published', 18900),

  ('d3', 'Pandya Kingdoms', 'பாண்டிய பேரரசு', 'History', 2462,
   'https://images.pexels.com/photos/31969428/pexels-photo-31969428.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/31969428/pexels-photo-31969428.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023, 'Tamil',
   'The rise and fall of the Pandya dynasty — temples, trade, and the lost glory of Madurai.',
   'பாண்டிய அரசின் எழுச்சியும் வீழ்ச்சியும் — கோயில்கள், வர்த்தகம், மதுரையின் இழந்த பெருமை.',
   NULL, NULL, true, NULL, ARRAY[]::text[], 'Published', 31200),

  ('d4', 'Signals From Space', 'விண்வெளி சமிக்ஞைகள்', 'Science', 1710,
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'English',
   'How ISRO scientists in Tamil Nadu track deep-space signals from the Mangalyaan mission.',
   'இஸ்ரோ விஞ்ஞானிகள் மங்கல்யானில் இருந்து வரும் ஆழ்வெளி சமிக்ஞைகளை எப்படி கண்காணிக்கிறார்கள்.',
   'NEW', NULL, false, NULL, ARRAY[]::text[], 'Draft', 0),

  ('d5', 'The Rice Crisis', 'நெல் நெருக்கடி', 'Society', 1195,
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'Tamil',
   'Farmers of the Cauvery delta battle climate change and debt in a changing agricultural landscape.',
   'காவிரி டெல்டா விவசாயிகள் காலநிலை மாற்றம் மற்றும் கடனுக்கு எதிராக போராடுதல்.',
   NULL, 0.42, false, NULL, ARRAY[]::text[], 'Published', 15600),

  ('d6', 'Temple Architecture', 'கோயில் கட்டிடக்கலை', 'Culture', 2172,
   'https://images.pexels.com/photos/5103732/pexels-photo-5103732.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/5103732/pexels-photo-5103732.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023, 'Tamil',
   'The engineering marvels behind Chola temple construction, decoded by modern architects.',
   'சோழர் கோயில் கட்டுமானத்தின் பொறியியல் அதிசயங்கள்.',
   NULL, NULL, true, NULL, ARRAY[]::text[], 'Published', 0),

  ('d7', 'Coastal Erosion', 'கடல் அரிப்பு', 'Investigation', 1360,
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'Tamil',
   'An investigative look at illegal sand mining and its devastating effect on Tamil Nadu''s coastline.',
   'சட்டவிரோத மணல் அகழ்வு மற்றும் தமிழக கடற்கரையில் அதன் அழிவு விளைவுகள்.',
   'NEW', NULL, false, NULL, ARRAY[]::text[], 'Published', 0),

  ('d8', 'Rivers That Disappeared', 'மறைந்த ஆறுகள்', 'Environment', 1575,
   'https://images.pexels.com/photos/34334928/pexels-photo-34334928.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/34334928/pexels-photo-34334928.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023, 'Tamil',
   'Tracing the lost rivers of Tamil Nadu and efforts to revive them through community action.',
   'தமிழகத்தின் மறைந்த ஆறுகளைத் தேடி மற்றும் அவற்றை மீட்டெடுக்கும் முயற்சிகள்.',
   NULL, NULL, false, NULL, ARRAY[]::text[], 'Published', 0),

  ('d9', 'The Math Whiz Kids', 'கணித மேதைகள்', 'Education', 1104,
   'https://images.pexels.com/photos/18189684/pexels-photo-18189684.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/18189684/pexels-photo-18189684.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'Tamil',
   'Rural Tamil Nadu students crack international math olympiads against all odds.',
   'கிராமப்புற மாணவர்கள் சர்வதேச கணித ஒலிம்பியாடில் வெற்றி.',
   'NEW', NULL, false, NULL, ARRAY[]::text[], 'Published', 0),

  ('d10', 'Silk Weavers of Kanchi', 'காஞ்சி பட்டு நெசவர்கள்', 'Culture', 1808,
   'https://images.pexels.com/photos/12435837/pexels-photo-12435837.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/12435837/pexels-photo-12435837.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023, 'Tamil',
   'The ancient art of Kanchipuram silk weaving and the families keeping it alive.',
   'காஞ்சிபுரம் பட்டு நெசவின் பழமையான கலை மற்றும் அதை பாதுகாக்கும் குடும்பங்கள்.',
   NULL, NULL, false, NULL, ARRAY[]::text[], 'Published', 0),

  ('d11', 'Unseen Ocean Depths', 'கடலின் ஆழங்கள்', 'Wildlife', 2090,
   'https://images.pexels.com/photos/9004341/pexels-photo-9004341.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/9004341/pexels-photo-9004341.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024, 'English',
   'Exploring the mysterious marine life off the Coromandel Coast.',
   'கோரமண்டல் கடற்கரையின் ரகசிய கடல் வாழ்க்கை.',
   NULL, NULL, true, NULL, ARRAY[]::text[], 'Published', 0),

  ('d12', 'Chola Bronzes', 'சோழ வெண்கலவு', 'History', 1653,
   'https://images.pexels.com/photos/10899308/pexels-photo-10899308.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/10899308/pexels-photo-10899308.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023, 'Tamil',
   'The lost-wax casting technique that produced the world''s finest bronze sculptures.',
   'உலகின் சிறந்த வெண்கல சிலைகளை உருவாக்கிய மெழுகு வார்ப்பு நுட்பம்.',
   NULL, NULL, false, NULL, ARRAY[]::text[], 'Published', 0);

-- =============================================================================
-- INSPIRE ITEMS (inspireItems array — 8 items)
-- =============================================================================

INSERT INTO inspire_items (id, title, title_ta, category, duration_sec, poster, quote, attribution, badge, status) VALUES
  ('i1', 'The Man Who Planted a Forest', 'காடு வளர்த்த மனிதன்', 'Changemakers', 384,
   'https://images.pexels.com/photos/16983197/pexels-photo-16983197.jpeg?auto=compress&cs=tinysrgb&w=800',
   'One tree at a time, I healed the land that raised me.', 'Muthusamy, Farmer', 'FEATURED', 'Published'),
  ('i2', 'From Tea Stall to Tech CEO', 'டீ கடையில் இருந்து சிஇஓ', 'Success Stories', 258,
   'https://images.pexels.com/photos/19747906/pexels-photo-19747906.jpeg?auto=compress&cs=tinysrgb&w=800',
   'Poverty taught me what no business school could.', 'Rajesh Kumar, CEO', NULL, 'Published'),
  ('i3', 'Never Give Up', 'ஒருபோதும் விடாதே', 'Motivation', 175,
   'https://images.pexels.com/photos/673018/pexels-photo-673018.jpeg?auto=compress&cs=tinysrgb&w=800',
   'விழுந்தால் எழு. அதுதான் வாழ்க்கை.', 'Daily Dose', NULL, 'Published'),
  ('i4', 'The Girl Who Built a School', 'பள்ளி கட்டிய பெண்', 'Changemakers', 340,
   'https://images.pexels.com/photos/35558791/pexels-photo-35558791.jpeg?auto=compress&cs=tinysrgb&w=800',
   'Education is the only weapon that grows sharper with sharing.', 'Priya Subramaniam', NULL, 'Published'),
  ('i5', 'Fearless at Sixteen', 'பதினாறில் துணிவு', 'Youth Voices', 192,
   'https://images.pexels.com/photos/14555586/pexels-photo-14555586.jpeg?auto=compress&cs=tinysrgb&w=800',
   'Age is a number. Courage is a choice.', 'Karthika, Student', NULL, 'Published'),
  ('i6', 'Loss Taught Me to Live', 'இழப்பு கற்ற பாடம்', 'Life Lessons', 287,
   'https://images.pexels.com/photos/6945/pexels-photo-6945.jpeg?auto=compress&cs=tinysrgb&w=800',
   'I lost everything at 40. That''s when life truly began.', 'Anand Krishnan', NULL, 'Published'),
  ('i7', 'The Athlete Without Legs', 'கால்கள் இல்லாத வீரர்', 'Success Stories', 302,
   'https://images.pexels.com/photos/673018/pexels-photo-673018.jpeg?auto=compress&cs=tinysrgb&w=800',
   'My legs are not my limits. My mind is.', 'Velmurugan, Para-athlete', NULL, 'Published'),
  ('i8', 'Voice of the Villages', 'கிராமத்தின் குரல்', 'Youth Voices', 218,
   'https://images.pexels.com/photos/10464476/pexels-photo-10464476.jpeg?auto=compress&cs=tinysrgb&w=800',
   'My microphone is my weapon against silence.', 'Deepika, Journalist', NULL, 'Published');

-- =============================================================================
-- LIVE SLOTS (liveSchedule array — 6 items)
-- =============================================================================

INSERT INTO live_slots (id, time_display, time_24, title, title_ta, duration_display, thumb, is_live, description, sort_order) VALUES
  ('l1', '06:00 PM', '18:00', 'Morning Ecology', 'காலை சுற்றுச்சூழல்', '30 min',
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=400',
   false, 'Daily bulletin on environmental news across Tamil Nadu.', 0),
  ('l2', '06:30 PM', '18:30', 'Wild Tamil Nadu', 'வனத் தமிழகம்', '45 min',
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=400',
   true, 'Live from Anamalai — tracking the tiger population in real time.', 1),
  ('l3', '07:15 PM', '19:15', 'History Uncovered', 'வரலாற்று ரகசியம்', '40 min',
   'https://images.pexels.com/photos/31969428/pexels-photo-31969428.jpeg?auto=compress&cs=tinysrgb&w=400',
   false, 'New findings from the Pandya excavation site.', 2),
  ('l4', '07:55 PM', '19:55', 'Science Today', 'இன்றைய அறிவியல்', '25 min',
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=400',
   false, 'Latest breakthroughs from Tamil Nadu research labs.', 3),
  ('l5', '08:20 PM', '20:20', 'Delta Stories', 'டெல்டா கதைகள்', '35 min',
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=400',
   false, 'Ground report from the Cauvery delta farming community.', 4),
  ('l6', '08:55 PM', '20:55', 'Late Night Investigates', 'இரவு விசாரணை', '50 min',
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=400',
   false, 'In-depth investigation into coastal sand mining networks.', 5);

-- =============================================================================
-- USERS (adminUsers array — 7 items)
-- =============================================================================

INSERT INTO users (id, name, email, role, status, joined_at) VALUES
  ('u1', 'Arjun Velu', 'arjun@gmail.com', 'Viewer', 'Active', '2024-01-15'),
  ('u2', 'Priya Subramaniam', 'priya.s@gmail.com', 'Viewer', 'Active', '2024-02-10'),
  ('u3', 'Tamil Tea Co.', 'ads@tamiltea.in', 'Sponsor', 'Active', '2024-03-05'),
  ('u4', 'Chennai Motors', 'marketing@chennaimotors.in', 'Sponsor', 'Active', '2024-04-12'),
  ('u5', 'Karthik Raman', 'karthik@docs.in', 'Creator', 'Active', '2023-12-01'),
  ('u6', 'Lakshmi Rao', 'lakshmi.r@gmail.com', 'Viewer', 'Suspended', '2024-05-20'),
  ('u7', 'A2B Foods', 'promo@a2b.in', 'Sponsor', 'Pending', '2024-06-15');

-- =============================================================================
-- SPONSORS (adminSponsors array — 4 items)
-- =============================================================================

INSERT INTO sponsors (id, user_id, name, status, wallet_balance_paise, joined_at) VALUES
  ('s1', 'u3', 'Tamil Tea Co.', 'Active', 500000, '2024-03-05'),
  ('s2', 'u4', 'Chennai Motors', 'Pending', 0, '2024-04-12'),
  ('s3', 'u7', 'A2B Foods', 'Active', 300000, '2024-06-15'),
  ('s4', NULL, 'Mylapore Silks', 'Active', 100000, '2024-01-20');

-- =============================================================================
-- CAMPAIGNS (campaigns array — 4 items)
-- =============================================================================

INSERT INTO campaigns (id, sponsor_id, name, status, budget_paise, spend_paise, impressions, clicks, start_date, submitted_at) VALUES
  ('c1', 's1', 'Nilgiri Tea Summer Push', 'Active', 5000000, 1850000, 124500, 4230, '2024-07-15', '2024-07-10'),
  ('c2', 's2', 'Chennai Motors EV Awareness', 'Pending Approval', 2500000, 0, 0, 0, '2024-08-10', '2024-08-10'),
  ('c3', 's3', 'A2B Festive Thali', 'Active', 3000000, 1220000, 89200, 3150, '2024-07-28', '2024-07-25'),
  ('c4', 's4', 'Mylapore Silk Wedding Sale', 'Ended', 6000000, 4500000, 210000, 8900, '2024-06-01', '2024-05-28');

-- Additional pending campaigns from adminPendingCampaigns
INSERT INTO campaigns (id, sponsor_id, name, status, budget_paise, submitted_at) VALUES
  ('pc2', 's3', 'Diwali Sweet Special', 'Pending Approval', 1800000, '2024-08-08'),
  ('pc3', 's4', 'Brand Launch Teaser', 'Pending Approval', 3200000, '2024-08-05');

-- =============================================================================
-- AD CONTENTS (ads array — 4 items)
-- =============================================================================

INSERT INTO ad_contents (id, campaign_id, sponsor_name, sponsor_logo, headline, body, cta, bg_image, accent, status) VALUES
  ('ad1', 'c1', 'Tamil Tea Co.', '', 'Pure Nilgiri Tea, Delivered Fresh',
   'Hand-picked from the Blue Mountains. 20% off your first order.', 'Buy Now',
   'https://images.pexels.com/photos/3714923/pexels-photo-3714923.jpeg?auto=compress&cs=tinysrgb&w=800',
   '#2E7D32', 'Live'),
  ('ad2', 'c2', 'Chennai Motors', '', 'Drive the Future — Electric Scooters',
   'Zero emissions. Zero noise. 100% Tamil Nadu made. Book a test ride today.', 'Learn More',
   'https://images.pexels.com/photos/9168370/pexels-photo-9168370.jpeg?auto=compress&cs=tinysrgb&w=800',
   '#1565C0', 'Live'),
  ('ad3', 'c3', 'A2B Foods', '', 'Authentic Tamil Meals, Anywhere',
   'Order traditional thali and get free delivery across Tamil Nadu.', 'Order Now',
   'https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&w=800',
   '#EF6C00', 'Live'),
  ('ad4', 'c4', 'Mylapore Silks', '', 'Wedding Season Sale — Up to 40% Off',
   'Premium Kanchipuram silk sarees. Shop the new collection.', 'Shop Now',
   'https://images.pexels.com/photos/13042447/pexels-photo-13042447.jpeg?auto=compress&cs=tinysrgb&w=800',
   '#AD1457', 'Live');

-- =============================================================================
-- AD PLACEMENTS (adminAdPlacements array — 5 items)
-- =============================================================================

INSERT INTO ad_placements (id, ad_content_id, sponsor_name, placement, impressions, status) VALUES
  ('ap1', 'ad1', 'Tamil Tea Co.', 'Home Banner #1', 45000, 'Live'),
  ('ap2', 'ad2', 'Chennai Motors', 'Explore Native Card', 28000, 'Live'),
  ('ap3', 'ad3', 'A2B Foods', 'Home Banner #2', 39000, 'Live'),
  ('ap4', 'ad4', 'Mylapore Silks', 'Live Schedule Banner', 22000, 'Live'),
  ('ap5', 'ad1', 'Tamil Tea Co.', 'Video Pre-roll', 56000, 'Live');

-- =============================================================================
-- FEED REELS (feedReels array — 10 items)
-- =============================================================================

INSERT INTO feed_reels (id, title, title_ta, caption, caption_ta, creator, creator_handle, content_type, genre, duration_sec, thumb, likes, comments, shares, views, status, uploaded_at, strip_ad_host, banner_after, attached_campaign, sort_order) VALUES
  ('r1', 'Cauvery Delta Crisis Update', 'காவிரி டெல்டா நெருக்கடி',
   'Ground report from Thanjavur — farmers protest water release cuts.',
   'தஞ்சாவூர் நிலஅறிக்கை — விவசாயிகள் நீர் வெட்டுக்கு எதிர்ப்பு.',
   'Vallavan News', '@vallavannews', 'News', 'Society', 45,
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=800',
   12400, 340, 890, 145000, 'Published', '2024-08-10', true, false, NULL, 0),

  ('r2', 'Tiger Sighting at Anamalai', 'ஆனைமலையில் புலி',
   'Rare footage of a Bengal tiger crossing a forest trail at dawn.',
   'விடியற்காலையில் வனப்பாதையில் புலி கடந்து செல்லும் அரிய காட்சி.',
   'Wild Tamil Nadu', '@wildtn', 'Teaser', 'Wildlife', 32,
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=800',
   45200, 1200, 3400, 560000, 'Published', '2024-08-09', false, false, NULL, 1),

  ('r3', 'The Man Who Planted 10,000 Trees', 'பத்தாயிரம் மரம் வளர்த்த மனிதன்',
   'Sixty seconds of inspiration — one man''s mission to reforest his village.',
   'அறுபது வினாடி ஊக்கம் — ஒருவரின் கிராம காடு வளர்ப்பு பயணம்.',
   'Inspire Shorts', '@inspireshorts', 'Short Story', 'Changemakers', 60,
   'https://images.pexels.com/photos/16983197/pexels-photo-16983197.jpeg?auto=compress&cs=tinysrgb&w=800',
   89000, 2100, 12000, 1200000, 'Published', '2024-08-08', true, true, 'Nilgiri Tea Summer Push', 2),

  ('r4', 'Chola Bronze Technique Revealed', 'சோழ வெண்கல நுட்பம்',
   'Watch the ancient lost-wax casting process in 45 seconds.',
   'நாற்பத்தைந்து வினாடியில் பழமையான மெழுகு வார்ப்பு நுட்பம்.',
   'Heritage TV', '@heritagetv', 'Teaser', 'History', 48,
   'https://images.pexels.com/photos/10899308/pexels-photo-10899308.jpeg?auto=compress&cs=tinysrgb&w=800',
   23100, 560, 1800, 320000, 'Published', '2024-08-07', false, false, NULL, 3),

  ('r5', 'ISRO Launch Tracking Live', 'இஸ்ரோ ஏவுதல் நேரடி',
   'Quick update on the latest satellite launch from Sriharikota.',
   'ஸ்ரீஹரிகோட்டாவில் இருந்து செயற்கைக்கோள் ஏவுதல் செய்தி.',
   'Vallavan News', '@vallavannews', 'News', 'Science', 38,
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=800',
   34200, 890, 2100, 480000, 'Published', '2024-08-07', true, false, NULL, 4),

  ('r6', 'Kanchipuram Silk in 60 Seconds', 'காஞ்சிபுரம் பட்டு அறுபது வினாடி',
   'The art of weaving a silk saree — from thread to masterpiece.',
   'பட்டுப்புடவை நெய்வதில் இருந்து தயாரிப்பு வரை — அறுபது வினாடி.',
   'Culture Capsule', '@culturecapsule', 'Teaser', 'Culture', 60,
   'https://images.pexels.com/photos/12435837/pexels-photo-12435837.jpeg?auto=compress&cs=tinysrgb&w=800',
   56700, 1500, 4500, 780000, 'Published', '2024-08-06', false, false, NULL, 5),

  ('r7', 'From Tea Stall to Tech CEO', 'டீ கடையில் இருந்து சிஇஓ',
   'Rajesh Kumar''s journey from a roadside tea stall to a tech empire.',
   'ராஜேஷ் குமாரின் டீ கடையில் இருந்து தொழில்நுட்ப சாம்ராஜ்யம் வரை.',
   'Inspire Shorts', '@inspireshorts', 'Short Story', 'Success Stories', 55,
   'https://images.pexels.com/photos/19747906/pexels-photo-19747906.jpeg?auto=compress&cs=tinysrgb&w=800',
   102000, 3400, 18000, 2100000, 'Published', '2024-08-05', true, false, NULL, 6),

  ('r8', 'Mangrove Loss: The Numbers', 'சதுப்பு நில இழப்பு: எண்கள்',
   'Data visualization showing Tamil Nadu''s mangrove decline over 20 years.',
   'இருபது ஆண்டுகளில் தமிழக சதுப்பு நில வீழ்ச்சி தரவு காட்சி.',
   'Vallavan News', '@vallavannews', 'News', 'Environment', 42,
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=800',
   18900, 430, 980, 234000, 'Published', '2024-08-04', false, false, NULL, 7),

  ('r9', 'Coastal Erosion Investigation Clip', 'கடல் அரிப்பு விசாரணை',
   'Exclusive footage of illegal sand mining operations exposed.',
   'சட்டவிரோத மணல் அகழ்வு நடவடிக்கைகள் வெளிப்படுத்தப்பட்டது.',
   'Investigate TN', '@investigatetn', 'Teaser', 'Investigation', 50,
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=800',
   67000, 2800, 8900, 950000, 'Published', '2024-08-03', true, true, 'Chennai Motors EV Awareness', 8),

  ('r10', 'The Math Whiz Kids Story', 'கணித மேதைகள் கதை',
   'Rural students beat the odds to win international math competitions.',
   'கிராமப்புற மாணவர்கள் சர்வதேச கணித போட்டியில் வெற்றி.',
   'Inspire Shorts', '@inspireshorts', 'Short Story', 'Education', 75,
   'https://images.pexels.com/photos/18189684/pexels-photo-18189684.jpeg?auto=compress&cs=tinysrgb&w=800',
   78000, 1900, 6500, 1100000, 'Published', '2024-08-02', false, false, NULL, 9);

-- =============================================================================
-- NOTIFICATIONS (notifications array — 7 items)
-- =============================================================================

INSERT INTO notifications (id, user_id, type, title, title_ta, body, unread, created_at) VALUES
  ('n1', NULL, 'episode', 'New Episode Available', 'புதிய அத்தியாயம்',
   'The Last Mangroves — Episode 3 is now streaming', true, now() - interval '2 minutes'),
  ('n2', NULL, 'live', 'Live Now: Wild Tamil Nadu', 'நேரடி: வனத் தமிழகம்',
   'Tiger tracking special starting now on VALLAVAN TV', true, now() - interval '12 minutes'),
  ('n3', NULL, 'sponsor', 'Special Offer from Tamil Tea Co.', 'தமிழ் டீ சிறப்பு சலுகை',
   '20% off Nilgiri tea — limited time only', true, now() - interval '1 hour'),
  ('n4', NULL, 'system', 'Welcome to Vallavan', 'வல்லவனுக்கு வரவேற்கிறோம்',
   'Free documentaries, supported by sponsors. Enjoy!', false, now() - interval '5 hours'),
  ('n5', NULL, 'episode', 'Watch Later Reminder', 'பின்னர் பார்க்க நினைவூட்டல்',
   'You saved "Pandya Kingdoms" 3 days ago. Ready to watch?', false, now() - interval '1 day'),
  ('n6', NULL, 'live', 'Live Reminder', 'நேரடி நினைவூட்டல்',
   'History Uncovered starts in 15 minutes', false, now() - interval '1 day'),
  ('n7', NULL, 'system', 'App Updated', 'செயலி புதுப்பிக்கப்பட்டது',
   'Version 2.1.0 — improved video player and new Inspire tab', false, now() - interval '2 days');

-- =============================================================================
-- AUDIT LOGS (adminAuditLogs array — 5 items)
-- =============================================================================

INSERT INTO audit_logs (id, user_email, action, created_at) VALUES
  ('al1', 'admin@vallavan', 'Approved campaign "Nilgiri Tea Summer Push"', '2024-08-05 14:32:00+05:30'),
  ('al2', 'admin@vallavan', 'Published "The Rice Crisis"', '2024-08-05 11:15:00+05:30'),
  ('al3', 'admin@vallavan', 'Suspended user lakshmi.r@gmail.com', '2024-08-04 18:45:00+05:30'),
  ('al4', 'admin@vallavan', 'Updated Live TV schedule', '2024-08-04 10:20:00+05:30'),
  ('al5', 'admin@vallavan', 'Rejected campaign "Spam Ads Inc."', '2024-08-03 16:10:00+05:30');
