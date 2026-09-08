/**
 * Canonical normalization for identity fields, applied at every WRITE boundary
 * (not just in readers). Phone = bare 10-digit (strip non-digits, last 10);
 * email = trimmed + lowercased. Mirrors the Flutter util lib/utils/identity.dart
 * and the SQL normalization in find_user_by_phone.
 */
export const normPhone = (p: string | null | undefined): string =>
  (p ?? '').replace(/\D/g, '').slice(-10);

export const normEmail = (e: string | null | undefined): string =>
  (e ?? '').trim().toLowerCase();
