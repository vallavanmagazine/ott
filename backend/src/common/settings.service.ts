import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Resolves integration secrets. Order: platform_settings table (set from the
 * admin "API Settings" page) → process.env fallback. Values are only ever read
 * here on the server; they never reach the client.
 */
@Injectable()
export class SettingsService {
  private cache = new Map<string, { value: string; at: number }>();
  private ttlMs = 60_000;

  constructor(private readonly supa: SupabaseService) {}

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < this.ttlMs) return cached.value || null;

    let value = '';
    try {
      const { data } = await this.supa.client
        .from('platform_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      value = data?.value ?? '';
    } catch {
      /* ignore — fall back to env */
    }
    if (!value) value = process.env[key] ?? '';
    this.cache.set(key, { value, at: Date.now() });
    return value || null;
  }

  async require(key: string): Promise<string> {
    const v = await this.get(key);
    if (!v) throw new Error(`Missing configuration: ${key}`);
    return v;
  }
}
