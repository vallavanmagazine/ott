import 'supabase_client.dart';

/// Sponsor registration (FIX 3 — identical fields to web). Writes the sponsors
/// business record. Links to the signed-in user when available. Idempotent by email.
class SponsorService {
  static Future<String?> register({
    required String businessName,
    required String ownerName,
    required String phone,
    required String email,
    required String businessType,
    required String district,
    String? gstNumber,
  }) async {
    final c = Db.client;
    if (c == null) return 'Service not configured';
    if (businessName.trim().isEmpty || ownerName.trim().isEmpty || phone.trim().length < 10 || email.trim().isEmpty) {
      return 'Business name, owner, a valid phone, and email are required';
    }
    final ownerId = c.auth.currentUser?.id;
    final payload = {
      'name': businessName.trim(),
      'owner_name': ownerName.trim(),
      'phone': phone.trim(),
      'email': email.trim(),
      'business_type': businessType,
      'district': district,
      'gst_number': (gstNumber != null && gstNumber.trim().isNotEmpty) ? gstNumber.trim() : null,
      'owner_id': ownerId,
    };
    try {
      final existing = await c.from('sponsors').select('id').ilike('email', email.trim()).maybeSingle();
      if (existing != null && existing['id'] != null) {
        await c.from('sponsors').update(payload).eq('id', existing['id']);
      } else {
        await c.from('sponsors').insert(payload);
      }
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  /// Resolve the current user's sponsor id, or null.
  static Future<String?> currentSponsorId() async {
    final c = Db.client;
    final user = c?.auth.currentUser;
    if (c == null || user == null) return null;
    try {
      final s = await c.from('sponsors').select('id').eq('owner_id', user.id).maybeSingle();
      return s?['id']?.toString();
    } catch (_) {
      return null;
    }
  }
}
