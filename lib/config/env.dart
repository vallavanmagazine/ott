/// Build-time configuration. Every secret is injected via `--dart-define` and
/// never committed. `String.fromEnvironment` values are compile-time constants,
/// so the `*Configured` getters below let dead feature branches be tree-shaken.
///
///   flutter build apk --release \
///     --dart-define=SUPABASE_ANON_KEY=xxxx \
///     --dart-define=RAZORPAY_KEY_ID=rzp_test_xxxx
class Env {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://ipybmgkorxidxuqlptgj.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

  /// Optional NestJS backend (payment verification, OTP relay, AI proxy).
  /// Empty → the app falls back to the client-side paths below.
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Razorpay publishable key id (`rzp_test_…` / `rzp_live_…`). This is a
  /// PUBLIC key — safe to ship in the APK. The key *secret* must never be here.
  static const razorpayKeyId = String.fromEnvironment('RAZORPAY_KEY_ID');

  /// Fast2SMS key for client-side OTP (DEV only). Empty → test OTP 123456.
  static const fast2smsKey = String.fromEnvironment('FAST2SMS_KEY');

  static const resendKey = String.fromEnvironment('RESEND_KEY');

  /// Anthropic key for the in-app assistants. Prefer routing through
  /// API_BASE_URL instead — a key compiled into an APK is extractable.
  static const anthropicKey = String.fromEnvironment('ANTHROPIC_API_KEY');
  static const anthropicModel = String.fromEnvironment(
    'ANTHROPIC_MODEL',
    defaultValue: 'claude-sonnet-4-5',
  );

  static bool get isConfigured => supabaseAnonKey.isNotEmpty;
  static bool get hasBackend => apiBaseUrl.isNotEmpty;
  static bool get fast2smsConfigured => fast2smsKey.isNotEmpty;
  static bool get razorpayConfigured => razorpayKeyId.isNotEmpty;
  static bool get aiConfigured => hasBackend || anthropicKey.isNotEmpty;
}
