import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Single shared client for the whole app. Auth persistence is made EXPLICIT
 * (localStorage + auto-refresh) so the admin's session — and therefore the JWT
 * attached to every PostgREST/RPC request — survives reloads and long-idle
 * pages. If the token weren't attached, is_admin() would evaluate false and
 * admin writes (e.g. platform_settings) would fail with an RLS error.
 */
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'vallavan-auth',
      },
    })
  : null;

/** True when Supabase is configured and available */
export const isSupabaseReady = !!supabase;
