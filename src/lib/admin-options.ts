/**
 * Fixed option lists for admin forms.
 *
 * ALL_GENRES must stay in sync with the `genre_type` Postgres enum
 * (supabase/schema.sql) — an insert with any other value is rejected by the
 * database, so admin-managed categories can rename these but not add to them.
 */
import type { Genre, FeedContentType } from '@/data/mockData';

export const ALL_GENRES: Genre[] = [
  'Environment', 'Wildlife', 'History', 'Science', 'Society', 'Investigation',
  'Education', 'Culture', 'Motivation', 'Success Stories', 'Life Lessons',
  'Changemakers', 'Youth Voices',
];

export const CONTENT_TYPES: FeedContentType[] = ['News', 'Teaser', 'Short Story', 'Other'];

export const CONTENT_STATUSES = ['Published', 'Draft'] as const;

export const BADGES = ['', 'FEATURED', 'NEW', 'EXCLUSIVE', 'TRENDING'] as const;

export const LANGUAGES = ['Tamil', 'English', 'Tamil + English'] as const;

/** Slots the ad engine can serve into — matches AdSlot in services/ad-engine.ts. */
export const AD_PLACEMENT_SLOTS = [
  'Video Pre-roll', 'Video Mid-roll', 'Video Post-roll',
  'Feed Strip', 'Feed Banner', 'Live TV Break', 'Home Banner',
] as const;

export const SOCIAL_PLATFORMS = ['Facebook', 'Instagram', 'X', 'YouTube', 'WhatsApp'] as const;

export const CAMPAIGN_STATUSES = ['Draft', 'Pending Approval', 'Active', 'Paused', 'Ended'] as const;

export const USER_ROLES = ['Viewer', 'Sponsor', 'Creator', 'Admin'] as const;

export const LOGO_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

export const TICKER_SPEEDS = ['slow', 'medium', 'fast'] as const;

/** Rupee display used across every admin money column. */
export function rupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** Compact rupee display for stat tiles: ₹1.2L / ₹45,000. */
export function rupeesCompactINR(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

/** 190000 → "190K". Used for impression/view counters. */
export function compactCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
