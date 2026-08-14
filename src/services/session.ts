/**
 * Client session for phone-OTP accounts (sponsor/freelancer). Stored in
 * localStorage — NOT a Supabase Auth session. Admin login still uses Supabase.
 */
export interface PhoneSession {
  userId: string;
  name: string;
  phone: string;
  email: string;
  role: 'Sponsor' | 'Freelancer';
  sponsorId?: string;
  freelancerId?: string;
}

const KEY = 'vallavan_session';

export function saveSession(s: PhoneSession): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function getSession(): PhoneSession | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as PhoneSession) : null; }
  catch { return null; }
}

export function clearSession(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
