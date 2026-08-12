import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client with the SERVICE ROLE key. Bypasses RLS — server-only.
 * Used for privileged reads/writes (wallet, settings, campaign lifecycle).
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL ?? '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
