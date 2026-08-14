-- Vallavan OTT — Final Seed Data
-- Enum values verified against actual schema:
--   notification_type: episode, live, sponsor, system (lowercase)
--   content_status: Published, Draft
--   feed_content_type: News, Teaser, "Short Story", Other
--   campaign_status: Draft, "Pending Approval", Active, Paused, Ended
--   sponsor_status: Active, Pending, Suspended
--   user_role/user_status: Viewer, Sponsor, Creator, Admin / Active, Suspended, Pending

-- DISTRICTS
INSERT INTO districts (name) VALUES
  ('Chennai'),('Coimbatore'),('Madurai'),('Tiruchirappalli'),('Salem'),('Tirunelveli'),
  ('Tiruppur'),('Vellore'),('Erode'),('Thoothukudi'),('Dindigul'),('Thanjavur'),
  ('Ramanathapuram'),('Sivaganga'),('Karur'),('Kanchipuram'),('Tiruvallur'),('Nagapattinam'),
  ('Cuddalore'),('Viluppuram'),('Namakkal'),('Dharmapuri'),('Krishnagiri'),('Virudhunagar'),
  ('Theni'),('Nilgiris'),('Tiruvarur'),('Ariyalur'),('Perambalur'),('Pudukkottai'),
  ('Sivakasi'),('Kanyakumari'),('Tenkasi'),('Tirupathur'),('Chengalpattu'),('Kallakurichi');

-- TRENDING SEARCHES
INSERT INTO trending_searches (term, sort_order) VALUES
  ('Tamil Wildlife',0),('Climate Change',1),('Pandya History',2),
  ('Cauvery River',3),('Chola Temples',4),('Tiger Reserve',5);

-- DOCUMENTARIES
INSERT INTO documentaries (title, title_ta, genre, duration_sec, poster, backdrop, year, language, synopsis, synopsis_ta, badge, progress, exclusive, director, "cast", status, views, sort_order) VALUES
  ('The Last Mangroves','கடைசி சதுப்பு நிலங்கள்','Environment',1458,
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'Tamil','A deep dive into the vanishing mangrove forests of the Tamil Nadu coast and the fisherfolk fighting to save them.',
   'தமிழக கடற்கரையில் அழிந்து வரும் சதுப்பு நிலங்கள் மற்றும் அவற்றைக் காப்பாற்ற போராடும் மீனவர்கள் பற்றிய ஆழமான பார்வை.',
   'FEATURED',NULL,false,'Karthik Raman',ARRAY['M. Selvan','Lakshmi Rao'],'Published',24500,0),
  ('Tigers of Anamalai','ஆனைமலை புலிகள்','Wildlife',1965,
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'Tamil','Tracking the elusive Bengal tigers through the misty hills of the Anamalai Tiger Reserve.',
   'ஆனைமலை புலி காப்பகத்தின் மூடுபனி மலைகளில் மறைந்திருக்கும் பெங்கால் புலிகளைத் தேடி.',
   'NEW',NULL,false,NULL,ARRAY[]::text[],'Published',18900,1),
  ('Pandya Kingdoms','பாண்டிய பேரரசு','History',2462,
   'https://images.pexels.com/photos/31969428/pexels-photo-31969428.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/31969428/pexels-photo-31969428.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023,'Tamil','The rise and fall of the Pandya dynasty — temples, trade, and the lost glory of Madurai.',
   'பாண்டிய அரசின் எழுச்சியும் வீழ்ச்சியும் — கோயில்கள், வர்த்தகம், மதுரையின் இழந்த பெருமை.',
   NULL,NULL,true,NULL,ARRAY[]::text[],'Published',31200,2),
  ('Signals From Space','விண்வெளி சமிக்ஞைகள்','Science',1710,
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'English','How ISRO scientists in Tamil Nadu track deep-space signals from the Mangalyaan mission.',
   'இஸ்ரோ விஞ்ஞானிகள் மங்கல்யானில் இருந்து வரும் ஆழ்வெளி சமிக்ஞைகளை எப்படி கண்காணிக்கிறார்கள்.',
   'NEW',NULL,false,NULL,ARRAY[]::text[],'Draft',0,3),
  ('The Rice Crisis','நெல் நெருக்கடி','Society',1195,
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'Tamil','Farmers of the Cauvery delta battle climate change and debt in a changing agricultural landscape.',
   'காவிரி டெல்டா விவசாயிகள் காலநிலை மாற்றம் மற்றும் கடனுக்கு எதிராக போராடுதல்.',
   NULL,0.42,false,NULL,ARRAY[]::text[],'Published',15600,4),
  ('Temple Architecture','கோயில் கட்டிடக்கலை','Culture',2172,
   'https://images.pexels.com/photos/5103732/pexels-photo-5103732.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/5103732/pexels-photo-5103732.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023,'Tamil','The engineering marvels behind Chola temple construction, decoded by modern architects.',
   'சோழர் கோயில் கட்டுமானத்தின் பொறியியல் அதிசயங்கள்.',
   NULL,NULL,true,NULL,ARRAY[]::text[],'Published',0,5),
  ('Coastal Erosion','கடல் அரிப்பு','Investigation',1360,
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'Tamil','An investigative look at illegal sand mining and its devastating effect on Tamil Nadu''s coastline.',
   'சட்டவிரோத மணல் அகழ்வு மற்றும் தமிழக கடற்கரையில் அதன் அழிவு விளைவுகள்.',
   'NEW',NULL,false,NULL,ARRAY[]::text[],'Published',0,6),
  ('Rivers That Disappeared','மறைந்த ஆறுகள்','Environment',1575,
   'https://images.pexels.com/photos/34334928/pexels-photo-34334928.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/34334928/pexels-photo-34334928.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023,'Tamil','Tracing the lost rivers of Tamil Nadu and efforts to revive them through community action.',
   'தமிழகத்தின் மறைந்த ஆறுகளைத் தேடி மற்றும் அவற்றை மீட்டெடுக்கும் முயற்சிகள்.',
   NULL,NULL,false,NULL,ARRAY[]::text[],'Published',0,7),
  ('The Math Whiz Kids','கணித மேதைகள்','Education',1104,
   'https://images.pexels.com/photos/18189684/pexels-photo-18189684.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/18189684/pexels-photo-18189684.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'Tamil','Rural Tamil Nadu students crack international math olympiads against all odds.',
   'கிராமப்புற மாணவர்கள் சர்வதேச கணித ஒலிம்பியாடில் வெற்றி.',
   'NEW',NULL,false,NULL,ARRAY[]::text[],'Published',0,8),
  ('Silk Weavers of Kanchi','காஞ்சி பட்டு நெசவர்கள்','Culture',1808,
   'https://images.pexels.com/photos/12435837/pexels-photo-12435837.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/12435837/pexels-photo-12435837.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023,'Tamil','The ancient art of Kanchipuram silk weaving and the families keeping it alive.',
   'காஞ்சிபுரம் பட்டு நெசவின் பழமையான கலை மற்றும் அதை பாதுகாக்கும் குடும்பங்கள்.',
   NULL,NULL,false,NULL,ARRAY[]::text[],'Published',0,9),
  ('Unseen Ocean Depths','கடலின் ஆழங்கள்','Wildlife',2090,
   'https://images.pexels.com/photos/9004341/pexels-photo-9004341.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/9004341/pexels-photo-9004341.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2024,'English','Exploring the mysterious marine life off the Coromandel Coast.',
   'கோரமண்டல் கடற்கரையின் ரகசிய கடல் வாழ்க்கை.',
   NULL,NULL,true,NULL,ARRAY[]::text[],'Published',0,10),
  ('Chola Bronzes','சோழ வெண்கலவு','History',1653,
   'https://images.pexels.com/photos/10899308/pexels-photo-10899308.jpeg?auto=compress&cs=tinysrgb&w=800',
   'https://images.pexels.com/photos/10899308/pexels-photo-10899308.jpeg?auto=compress&cs=tinysrgb&w=1280',
   2023,'Tamil','The lost-wax casting technique that produced the world''s finest bronze sculptures.',
   'உலகின் சிறந்த வெண்கல சிலைகளை உருவாக்கிய மெழுகு வார்ப்பு நுட்பம்.',
   NULL,NULL,false,NULL,ARRAY[]::text[],'Published',0,11);

-- INSPIRE ITEMS
INSERT INTO inspire_items (title,title_ta,category,duration_sec,poster,quote,attribution,badge,sort_order) VALUES
  ('The Man Who Planted a Forest','காடு வளர்த்த மனிதன்','Changemakers',384,
   'https://images.pexels.com/photos/16983197/pexels-photo-16983197.jpeg?auto=compress&cs=tinysrgb&w=800',
   'One tree at a time, I healed the land that raised me.','Muthusamy, Farmer','FEATURED',0),
  ('From Tea Stall to Tech CEO','டீ கடையில் இருந்து சிஇஓ','Success Stories',258,
   'https://images.pexels.com/photos/19747906/pexels-photo-19747906.jpeg?auto=compress&cs=tinysrgb&w=800',
   'Poverty taught me what no business school could.','Rajesh Kumar, CEO',NULL,1),
  ('Never Give Up','ஒருபோதும் விடாதே','Motivation',175,
   'https://images.pexels.com/photos/673018/pexels-photo-673018.jpeg?auto=compress&cs=tinysrgb&w=800',
   'விழுந்தால் எழு. அதுதான் வாழ்க்கை.','Daily Dose',NULL,2),
  ('The Girl Who Built a School','பள்ளி கட்டிய பெண்','Changemakers',340,
   'https://images.pexels.com/photos/35558791/pexels-photo-35558791.jpeg?auto=compress&cs=tinysrgb&w=800',
   'Education is the only weapon that grows sharper with sharing.','Priya Subramaniam',NULL,3),
  ('Fearless at Sixteen','பதினாறில் துணிவு','Youth Voices',192,
   'https://images.pexels.com/photos/14555586/pexels-photo-14555586.jpeg?auto=compress&cs=tinysrgb&w=800',
   'Age is a number. Courage is a choice.','Karthika, Student',NULL,4),
  ('Loss Taught Me to Live','இழப்பு கற்ற பாடம்','Life Lessons',287,
   'https://images.pexels.com/photos/6945/pexels-photo-6945.jpeg?auto=compress&cs=tinysrgb&w=800',
   'I lost everything at 40. That''s when life truly began.','Anand Krishnan',NULL,5),
  ('The Athlete Without Legs','கால்கள் இல்லாத வீரர்','Success Stories',302,
   'https://images.pexels.com/photos/673018/pexels-photo-673018.jpeg?auto=compress&cs=tinysrgb&w=800',
   'My legs are not my limits. My mind is.','Velmurugan, Para-athlete',NULL,6),
  ('Voice of the Villages','கிராமத்தின் குரல்','Youth Voices',218,
   'https://images.pexels.com/photos/10464476/pexels-photo-10464476.jpeg?auto=compress&cs=tinysrgb&w=800',
   'My microphone is my weapon against silence.','Deepika, Journalist',NULL,7);

-- LIVE SLOTS
INSERT INTO live_slots (title,title_ta,description,thumb,start_time24,duration_min,is_live,air_date,sort_order) VALUES
  ('Morning Ecology','காலை சுற்றுச்சூழல்','Daily bulletin on environmental news across Tamil Nadu.',
   'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=400','18:00',30,false,CURRENT_DATE,0),
  ('Wild Tamil Nadu','வனத் தமிழகம்','Live from Anamalai — tracking the tiger population in real time.',
   'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=400','18:30',45,true,CURRENT_DATE,1),
  ('History Uncovered','வரலாற்று ரகசியம்','New findings from the Pandya excavation site.',
   'https://images.pexels.com/photos/31969428/pexels-photo-31969428.jpeg?auto=compress&cs=tinysrgb&w=400','19:15',40,false,CURRENT_DATE,2),
  ('Science Today','இன்றைய அறிவியல்','Latest breakthroughs from Tamil Nadu research labs.',
   'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=400','19:55',25,false,CURRENT_DATE,3),
  ('Delta Stories','டெல்டா கதைகள்','Ground report from the Cauvery delta farming community.',
   'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=400','20:20',35,false,CURRENT_DATE,4),
  ('Late Night Investigates','இரவு விசாரணை','In-depth investigation into coastal sand mining networks.',
   'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=400','20:55',50,false,CURRENT_DATE,5);

-- APP_USERS (user_role: Viewer/Sponsor/Creator, user_status: Active/Suspended/Pending)
INSERT INTO app_users (name,email,role,status,created_at) VALUES
  ('Arjun Velu','arjun@gmail.com','Viewer','Active','2024-01-15'),
  ('Priya Subramaniam','priya.s@gmail.com','Viewer','Active','2024-02-10'),
  ('Tamil Tea Co.','ads@tamiltea.in','Sponsor','Active','2024-03-05'),
  ('Chennai Motors','marketing@chennaimotors.in','Sponsor','Active','2024-04-12'),
  ('Karthik Raman','karthik@docs.in','Creator','Active','2023-12-01'),
  ('Lakshmi Rao','lakshmi.r@gmail.com','Viewer','Suspended','2024-05-20'),
  ('A2B Foods','promo@a2b.in','Sponsor','Pending','2024-06-15');

-- SPONSORS (sponsor_status: Active/Pending/Suspended)
INSERT INTO sponsors (owner_id,name,email,status,created_at) VALUES
  ((SELECT id FROM app_users WHERE email='ads@tamiltea.in'),'Tamil Tea Co.','ads@tamiltea.in','Active','2024-03-05'),
  ((SELECT id FROM app_users WHERE email='marketing@chennaimotors.in'),'Chennai Motors','marketing@chennaimotors.in','Pending','2024-04-12'),
  ((SELECT id FROM app_users WHERE email='promo@a2b.in'),'A2B Foods','promo@a2b.in','Active','2024-06-15'),
  (NULL,'Mylapore Silks','silks@mylapore.in','Active','2024-01-20');

-- WALLETS
INSERT INTO wallets (sponsor_id,balance_paise) VALUES
  ((SELECT id FROM sponsors WHERE name='Tamil Tea Co.'),500000),
  ((SELECT id FROM sponsors WHERE name='Chennai Motors'),0),
  ((SELECT id FROM sponsors WHERE name='A2B Foods'),300000),
  ((SELECT id FROM sponsors WHERE name='Mylapore Silks'),100000);

-- CAMPAIGNS (campaign_status: Draft/"Pending Approval"/Active/Paused/Ended)
INSERT INTO campaigns (sponsor_id,name,status,impressions,clicks,spend_paise,budget_paise,start_date,submitted_at) VALUES
  ((SELECT id FROM sponsors WHERE name='Tamil Tea Co.'),'Nilgiri Tea Summer Push','Active',124500,4230,1850000,5000000,'2024-07-15','2024-07-10'),
  ((SELECT id FROM sponsors WHERE name='Chennai Motors'),'Chennai Motors EV Awareness','Pending Approval',0,0,0,2500000,'2024-08-10','2024-08-10'),
  ((SELECT id FROM sponsors WHERE name='A2B Foods'),'A2B Festive Thali','Active',89200,3150,1220000,3000000,'2024-07-28','2024-07-25'),
  ((SELECT id FROM sponsors WHERE name='Mylapore Silks'),'Mylapore Silk Wedding Sale','Ended',210000,8900,4500000,6000000,'2024-06-01','2024-05-28'),
  ((SELECT id FROM sponsors WHERE name='A2B Foods'),'Diwali Sweet Special','Pending Approval',0,0,0,1800000,NULL,'2024-08-08'),
  ((SELECT id FROM sponsors WHERE name='Mylapore Silks'),'Brand Launch Teaser','Pending Approval',0,0,0,3200000,NULL,'2024-08-05');

-- ADS
INSERT INTO ads (sponsor,sponsor_id,sponsor_logo,headline,body,cta,bg_image,accent,campaign_id) VALUES
  ('Tamil Tea Co.',(SELECT id FROM sponsors WHERE name='Tamil Tea Co.'),'','Pure Nilgiri Tea, Delivered Fresh',
   'Hand-picked from the Blue Mountains. 20% off your first order.','Buy Now',
   'https://images.pexels.com/photos/3714923/pexels-photo-3714923.jpeg?auto=compress&cs=tinysrgb&w=800','#2E7D32',
   (SELECT id FROM campaigns WHERE name='Nilgiri Tea Summer Push')),
  ('Chennai Motors',(SELECT id FROM sponsors WHERE name='Chennai Motors'),'','Drive the Future — Electric Scooters',
   'Zero emissions. Zero noise. 100% Tamil Nadu made. Book a test ride today.','Learn More',
   'https://images.pexels.com/photos/9168370/pexels-photo-9168370.jpeg?auto=compress&cs=tinysrgb&w=800','#1565C0',
   (SELECT id FROM campaigns WHERE name='Chennai Motors EV Awareness')),
  ('A2B Foods',(SELECT id FROM sponsors WHERE name='A2B Foods'),'','Authentic Tamil Meals, Anywhere',
   'Order traditional thali and get free delivery across Tamil Nadu.','Order Now',
   'https://images.pexels.com/photos/29148133/pexels-photo-29148133.jpeg?auto=compress&cs=tinysrgb&w=800','#EF6C00',
   (SELECT id FROM campaigns WHERE name='A2B Festive Thali')),
  ('Mylapore Silks',(SELECT id FROM sponsors WHERE name='Mylapore Silks'),'','Wedding Season Sale — Up to 40% Off',
   'Premium Kanchipuram silk sarees. Shop the new collection.','Shop Now',
   'https://images.pexels.com/photos/13042447/pexels-photo-13042447.jpeg?auto=compress&cs=tinysrgb&w=800','#AD1457',
   (SELECT id FROM campaigns WHERE name='Mylapore Silk Wedding Sale'));

-- AD PLACEMENTS
INSERT INTO ad_placements (sponsor,ad_id,placement,impressions,status) VALUES
  ('Tamil Tea Co.',(SELECT id FROM ads WHERE headline='Pure Nilgiri Tea, Delivered Fresh'),'Home Banner #1',45000,'Live'),
  ('Chennai Motors',(SELECT id FROM ads WHERE headline='Drive the Future — Electric Scooters'),'Explore Native Card',28000,'Live'),
  ('A2B Foods',(SELECT id FROM ads WHERE headline='Authentic Tamil Meals, Anywhere'),'Home Banner #2',39000,'Live'),
  ('Mylapore Silks',(SELECT id FROM ads WHERE headline='Wedding Season Sale — Up to 40% Off'),'Live Schedule Banner',22000,'Live'),
  ('Tamil Tea Co.',(SELECT id FROM ads WHERE headline='Pure Nilgiri Tea, Delivered Fresh'),'Video Pre-roll',56000,'Live');

-- FEED REELS (notification_type uses lowercase; content_type/genre use Title Case)
INSERT INTO feed_reels (title,title_ta,caption,caption_ta,creator,creator_handle,content_type,genre,duration_sec,thumb,likes,comments,shares,views,status,strip_ad_host,banner_after,attached_campaign,sort_order) VALUES
  ('Cauvery Delta Crisis Update','காவிரி டெல்டா நெருக்கடி','Ground report from Thanjavur — farmers protest water release cuts.','தஞ்சாவூர் நிலஅறிக்கை — விவசாயிகள் நீர் வெட்டுக்கு எதிர்ப்பு.','Vallavan News','@vallavannews','News','Society',45,'https://images.pexels.com/photos/20212135/pexels-photo-20212135.jpeg?auto=compress&cs=tinysrgb&w=800',12400,340,890,145000,'Published',true,false,NULL,0),
  ('Tiger Sighting at Anamalai','ஆனைமலையில் புலி','Rare footage of a Bengal tiger crossing a forest trail at dawn.','விடியற்காலையில் வனப்பாதையில் புலி கடந்து செல்லும் அரிய காட்சி.','Wild Tamil Nadu','@wildtn','Teaser','Wildlife',32,'https://images.pexels.com/photos/17374833/pexels-photo-17374833.jpeg?auto=compress&cs=tinysrgb&w=800',45200,1200,3400,560000,'Published',false,false,NULL,1),
  ('The Man Who Planted 10,000 Trees','பத்தாயிரம் மரம் வளர்த்த மனிதன்','Sixty seconds of inspiration — one man''s mission to reforest his village.','அறுபது வினாடி ஊக்கம் — ஒருவரின் கிராம காடு வளர்ப்பு பயணம்.','Inspire Shorts','@inspireshorts','Short Story','Changemakers',60,'https://images.pexels.com/photos/16983197/pexels-photo-16983197.jpeg?auto=compress&cs=tinysrgb&w=800',89000,2100,12000,1200000,'Published',true,true,(SELECT id FROM campaigns WHERE name='Nilgiri Tea Summer Push'),2),
  ('Chola Bronze Technique Revealed','சோழ வெண்கல நுட்பம்','Watch the ancient lost-wax casting process in 45 seconds.','நாற்பத்தைந்து வினாடியில் பழமையான மெழுகு வார்ப்பு நுட்பம்.','Heritage TV','@heritagetv','Teaser','History',48,'https://images.pexels.com/photos/10899308/pexels-photo-10899308.jpeg?auto=compress&cs=tinysrgb&w=800',23100,560,1800,320000,'Published',false,false,NULL,3),
  ('ISRO Launch Tracking Live','இஸ்ரோ ஏவுதல் நேரடி','Quick update on the latest satellite launch from Sriharikota.','ஸ்ரீஹரிகோட்டாவில் இருந்து செயற்கைக்கோள் ஏவுதல் செய்தி.','Vallavan News','@vallavannews','News','Science',38,'https://images.pexels.com/photos/6325002/pexels-photo-6325002.jpeg?auto=compress&cs=tinysrgb&w=800',34200,890,2100,480000,'Published',true,false,NULL,4),
  ('Kanchipuram Silk in 60 Seconds','காஞ்சிபுரம் பட்டு அறுபது வினாடி','The art of weaving a silk saree — from thread to masterpiece.','பட்டுப்புடவை நெய்வதில் இருந்து தயாரிப்பு வரை — அறுபது வினாடி.','Culture Capsule','@culturecapsule','Teaser','Culture',60,'https://images.pexels.com/photos/12435837/pexels-photo-12435837.jpeg?auto=compress&cs=tinysrgb&w=800',56700,1500,4500,780000,'Published',false,false,NULL,5),
  ('From Tea Stall to Tech CEO','டீ கடையில் இருந்து சிஇஓ','Rajesh Kumar''s journey from a roadside tea stall to a tech empire.','ராஜேஷ் குமாரின் டீ கடையில் இருந்து தொழில்நுட்ப சாம்ராஜ்யம் வரை.','Inspire Shorts','@inspireshorts','Short Story','Success Stories',55,'https://images.pexels.com/photos/19747906/pexels-photo-19747906.jpeg?auto=compress&cs=tinysrgb&w=800',102000,3400,18000,2100000,'Published',true,false,NULL,6),
  ('Mangrove Loss: The Numbers','சதுப்பு நில இழப்பு: எண்கள்','Data visualization showing Tamil Nadu''s mangrove decline over 20 years.','இருபது ஆண்டுகளில் தமிழக சதுப்பு நில வீழ்ச்சி தரவு காட்சி.','Vallavan News','@vallavannews','News','Environment',42,'https://images.pexels.com/photos/30004134/pexels-photo-30004134.jpeg?auto=compress&cs=tinysrgb&w=800',18900,430,980,234000,'Published',false,false,NULL,7),
  ('Coastal Erosion Investigation Clip','கடல் அரிப்பு விசாரணை','Exclusive footage of illegal sand mining operations exposed.','சட்டவிரோத மணல் அகழ்வு நடவடிக்கைகள் வெளிப்படுத்தப்பட்டது.','Investigate TN','@investigatetn','Teaser','Investigation',50,'https://images.pexels.com/photos/13519711/pexels-photo-13519711.jpeg?auto=compress&cs=tinysrgb&w=800',67000,2800,8900,950000,'Published',true,true,(SELECT id FROM campaigns WHERE name='Chennai Motors EV Awareness'),8),
  ('The Math Whiz Kids Story','கணித மேதைகள் கதை','Rural students beat the odds to win international math competitions.','கிராமப்புற மாணவர்கள் சர்வதேச கணித போட்டியில் வெற்றி.','Inspire Shorts','@inspireshorts','Short Story','Education',75,'https://images.pexels.com/photos/18189684/pexels-photo-18189684.jpeg?auto=compress&cs=tinysrgb&w=800',78000,1900,6500,1100000,'Published',false,false,NULL,9);

-- NOTIFICATIONS (notification_type: episode/live/sponsor/system — ALL LOWERCASE)
INSERT INTO notifications (type,title,title_ta,body,unread,created_at) VALUES
  ('episode','New Episode Available','புதிய அத்தியாயம்','The Last Mangroves — Episode 3 is now streaming',true,now()-interval '2 minutes'),
  ('live','Live Now: Wild Tamil Nadu','நேரடி: வனத் தமிழகம்','Tiger tracking special starting now on VALLAVAN TV',true,now()-interval '12 minutes'),
  ('sponsor','Special Offer from Tamil Tea Co.','தமிழ் டீ சிறப்பு சலுகை','20% off Nilgiri tea — limited time only',true,now()-interval '1 hour'),
  ('system','Welcome to Vallavan','வல்லவனுக்கு வரவேற்கிறோம்','Free documentaries, supported by sponsors. Enjoy!',false,now()-interval '5 hours'),
  ('episode','Watch Later Reminder','பின்னர் பார்க்க நினைவூட்டல்','You saved "Pandya Kingdoms" 3 days ago. Ready to watch?',false,now()-interval '1 day'),
  ('live','Live Reminder','நேரடி நினைவூட்டல்','History Uncovered starts in 15 minutes',false,now()-interval '1 day'),
  ('system','App Updated','செயலி புதுப்பிக்கப்பட்டது','Version 2.1.0 — improved video player and new Inspire tab',false,now()-interval '2 days');

-- AUDIT LOGS
INSERT INTO audit_logs (actor,action,created_at) VALUES
  ('admin@vallavan','Approved campaign "Nilgiri Tea Summer Push"','2024-08-05 14:32:00+05:30'),
  ('admin@vallavan','Published "The Rice Crisis"','2024-08-05 11:15:00+05:30'),
  ('admin@vallavan','Suspended user lakshmi.r@gmail.com','2024-08-04 18:45:00+05:30'),
  ('admin@vallavan','Updated Live TV schedule','2024-08-04 10:20:00+05:30'),
  ('admin@vallavan','Rejected campaign "Spam Ads Inc."','2024-08-03 16:10:00+05:30');

-- PRICING CONFIG
INSERT INTO pricing_config (base_post_paise,per_district_paise,bill_dual_as_single) VALUES (50000,5000,true);
