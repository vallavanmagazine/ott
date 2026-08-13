-- ============================================================================
-- Live TV go-live switch. When false → viewers see "Coming Soon" promo mode.
-- When true → LiveScreen shows the real player + broadcast overlay.
-- Flip this from the admin Broadcast Control panel once playout is running.
-- ============================================================================
alter table broadcast_config add column if not exists channel_live boolean default false;
