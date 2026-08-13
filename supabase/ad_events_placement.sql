-- ============================================================================
-- Ad placement tracking. ad_events.kind stays 'impression' | 'click'; the ad
-- slot type (preroll/midroll/postroll/strip/banner) goes in `placement`.
-- Run once.
-- ============================================================================
alter table ad_events add column if not exists placement text;
create index if not exists ad_events_ad_idx on ad_events (ad_id);
