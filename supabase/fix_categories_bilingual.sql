-- ============================================================================
-- VALLAVAN — bilingual category names. Adds a Tamil display name to
-- content_categories. Run AFTER fix_categories_roles.sql. Re-runnable.
-- ============================================================================

ALTER TABLE content_categories ADD COLUMN IF NOT EXISTS display_name_ta text;

-- Seed Tamil names for the standard categories (only fills blanks).
UPDATE content_categories c SET display_name_ta = v.ta
FROM (VALUES
  ('explore', 'Environment',    'சுற்றுச்சூழல்'),
  ('explore', 'Wildlife',       'வனவிலங்குகள்'),
  ('explore', 'History',        'வரலாறு'),
  ('explore', 'Science',        'அறிவியல்'),
  ('explore', 'Society',        'சமூகம்'),
  ('explore', 'Investigation',  'விசாரணை'),
  ('explore', 'Education',      'கல்வி'),
  ('explore', 'Culture',        'பண்பாடு'),
  ('inspire', 'Motivation',     'ஊக்கம்'),
  ('inspire', 'Success Stories','வெற்றிக் கதைகள்'),
  ('inspire', 'Life Lessons',   'வாழ்க்கைப் பாடங்கள்'),
  ('inspire', 'Changemakers',   'மாற்றம் படைப்போர்'),
  ('inspire', 'Youth Voices',   'இளையோர் குரல்கள்'),
  ('feed',    'News',           'செய்திகள்'),
  ('feed',    'Teaser',         'முன்னோட்டம்'),
  ('feed',    'Short Story',    'சிறுகதை'),
  ('feed',    'Other',          'மற்றவை')
) AS v(section, name, ta)
WHERE c.section = v.section AND c.name = v.name AND (c.display_name_ta IS NULL OR c.display_name_ta = '');
