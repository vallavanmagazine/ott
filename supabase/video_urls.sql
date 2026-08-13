-- ============================================================================
-- Video support: add video_url to feed_reels + inspire_items, and seed sample
-- YouTube URLs so documentaries actually play. Run once in the SQL Editor.
-- (documentaries.video_url already exists from rls_and_tables.sql.)
-- ============================================================================

alter table feed_reels    add column if not exists video_url text;
alter table inspire_items add column if not exists video_url text;

-- Sample playable videos (YouTube embeds) for the seeded documentaries.
UPDATE documentaries SET video_url = 'https://www.youtube.com/embed/LXb3EKWsInQ' WHERE title = 'The Last Mangroves';
UPDATE documentaries SET video_url = 'https://www.youtube.com/embed/5qap5aO4i9A' WHERE title = 'Tigers of Anamalai';
UPDATE documentaries SET video_url = 'https://www.youtube.com/embed/YbgnlkJPga4' WHERE title = 'Pandya Kingdoms';
UPDATE documentaries SET video_url = 'https://www.youtube.com/embed/ydYDqZQpim8' WHERE title = 'Signals From Space';
UPDATE documentaries SET video_url = 'https://www.youtube.com/embed/UqJbkVPMfXc' WHERE title = 'The Rice Crisis';
UPDATE documentaries SET video_url = 'https://www.youtube.com/embed/3VSYtLjKKIw' WHERE title = 'Temple Architecture';
