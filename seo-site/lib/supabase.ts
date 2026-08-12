import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
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
