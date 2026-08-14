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

  static bool get isConfigured => supabaseAnonKey.isNotEmpty;
  static bool get hasBackend => apiBaseUrl.isNotEmpty;
}
