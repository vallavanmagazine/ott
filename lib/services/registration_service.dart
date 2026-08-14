import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_client.dart';
import 'api_service.dart';

/// Account registration (sponsor + freelancer). OTP-gated, passwordless.
/// Account creation uses Supabase email OTP (no external key). When the backend
/// + Fast2SMS are configured we verify MOBILE first; otherwise email OTP only.
class RegistrationService {
  static bool get phoneOtpAvailable => Api.hasBackend;

  /// Send a mobile OTP via Fast2SMS (backend). Returns error string or null.
  static Future<String?> sendMobileOtp(String phone) async {
    try {
      await Api.post('/api/otp/send', {'phone': phone});
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  static Future<bool> verifyMobileOtp(String phone, String code) async {
    try {
      final res = await Api.post('/api/otp/verify', {'phone': phone, 'code': code});
      return res['ok'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Send the email OTP that creates the account (Supabase built-in).
  static Future<String?> sendEmailOtp(String email, {required String name, required String phone, required String role, required String district}) async {
    final c = Db.client;
    if (c == null) return 'Supabase not configured';
    try {
      await c.auth.signInWithOtp(
        email: email,
        shouldCreateUser: true,
        data: {'name': name, 'phone': phone, 'role': role, 'district': district},
      );
      return null;
    } catch (e) {
      return e.toString();
    }
  }

  /// Verify email OTP → session → create app_users + sponsors/freelancers rows.
  /// Returns error string or null on success.
  static Future<String?> verifyEmailOtpAndCreate({
    required String email,
    required String token,
    required String role,
    required String name,
    required String phone,
    required String district,
  }) async {
    final c = Db.client;
    if (c == null) return 'Supabase not configured';
    try {
      final res = await c.auth.verifyOTP(email: email, token: token, type: OtpType.email);
      final user = res.user;
      if (user == null) return 'Invalid or expired code.';

      await c.from('app_users').upsert(
        {'id': user.id, 'email': email, 'name': name, 'phone': phone, 'role': role, 'status': 'active'},
        onConflict: 'email',
      );

      if (role == 'sponsor') {
        final existing = await c.from('sponsors').select('id').ilike('email', email).maybeSingle();
        final payload = {'name': name, 'owner_name': name, 'email': email, 'phone': phone, 'district': district, 'owner_id': user.id, 'status': 'Pending'};
        if (existing != null && existing['id'] != null) {
          await c.from('sponsors').update(payload).eq('id', existing['id']);
        } else {
          await c.from('sponsors').insert(payload);
        }
      } else {
        final existing = await c.from('freelancers').select('id').ilike('email', email).maybeSingle();
        final payload = {'user_id': user.id, 'name': name, 'email': email, 'phone': phone, 'district': district, 'roles': <String>[], 'status': 'pending'};
        if (existing != null && existing['id'] != null) {
          await c.from('freelancers').update(payload).eq('id', existing['id']);
        } else {
          await c.from('freelancers').insert(payload);
        }
      }
      return null;
    } catch (e) {
      return e.toString();
    }
  }
}
