/// Supabase configuration. Keys are injected at build/run time via --dart-define,
/// never hard-coded. The project URL is public and defaults for convenience.
///
///   flutter run --dart-define=SUPABASE_ANON_KEY=xxxx
///   flutter build apk --release --dart-define=SUPABASE_ANON_KEY=xxxx
class Env {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://ipybmgkorxidxuqlptgj.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// NestJS backend base URL (payment links, OTP). Empty → those features are
  /// disabled and the UI explains the setup step. Inject with:
  ///   --dart-define=API_BASE_URL=https://api.vallavan.in
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Fast2SMS key for client-side OTP (DEV). Empty → test OTP (123456).
  ///   flutter build apk --dart-define=FAST2SMS_KEY=xxxx
  static const fast2smsKey = String.fromEnvironment('FAST2SMS_KEY');
  static const resendKey = String.fromEnvironment('RESEND_KEY');

  static bool get isConfigured => supabaseAnonKey.isNotEmpty;
  static bool get hasBackend => apiBaseUrl.isNotEmpty;
  static bool get fast2smsConfigured => fast2smsKey.isNotEmpty;
}
