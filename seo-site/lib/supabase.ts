import { createClient } from '@supabase/supabase-js';

// Placeholder fallbacks keep createClient from throwing during `next build`
// when env is absent; live data requires the real anon key at runtime.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  { auth: { persistSession: false } },
);

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vallavan.in';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.vallavan.in';

export interface Doc {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  poster: string;
  backdrop: string;
  year: number;
  duration_sec: number;
  language: string;
}
