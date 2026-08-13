import 'supabase_client.dart';

class AuthResult {
  final bool ok;
  final String? error;
  final String? role;
  const AuthResult(this.ok, {this.error, this.role});
}

/// Sponsor auth via Supabase (email + password), mirroring the web AuthContext.
class AuthService {
  static bool get isLoggedIn => Db.client?.auth.currentUser != null;
  static String? get email => Db.client?.auth.currentUser?.email;

  static Future<AuthResult> login(String email, String password) async {
    final c = Db.client;
    if (c == null) return const AuthResult(false, error: 'Auth not configured');
    try {
      final res = await c.auth.signInWithPassword(email: email, password: password);
      if (res.user == null) return const AuthResult(false, error: 'Invalid credentials');
      String? role;
      try {
        final row = await c.from('app_users').select('role').ilike('email', email).maybeSingle();
        role = row?['role'] as String?;
      } catch (_) {}
      return AuthResult(true, role: role);
    } catch (e) {
      return AuthResult(false, error: e.toString());
    }
  }

  static Future<void> logout() async => Db.client?.auth.signOut();
}
