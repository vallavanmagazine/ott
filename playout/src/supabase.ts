import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { persistSession: false } },
);

export const VIDEO_DIR = process.env.VIDEO_DIR ?? '/data/videos';
export const HLS_OUTPUT_DIR = process.env.HLS_OUTPUT_DIR ?? '/var/www/live';
