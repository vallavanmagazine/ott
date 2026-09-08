/// Canonical normalization for identity fields, applied at every WRITE boundary
/// (not just in readers). Phone = bare 10-digit (strip non-digits, last 10);
/// email = trimmed + lowercased. Mirrors the web util src/lib/identity.ts and
/// the SQL normalization in find_user_by_phone.
String normPhone(String? p) {
  final d = (p ?? '').replaceAll(RegExp(r'\D'), '');
  return d.length > 10 ? d.substring(d.length - 10) : d;
}

String normEmail(String? e) => (e ?? '').trim().toLowerCase();
