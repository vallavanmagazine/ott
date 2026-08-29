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

  /// Public site URL. Not a secret and not an API endpoint — it is sent as the
  /// `Referer` when fetching Bunny-hosted video (see utils/video.dart
  /// videoHttpHeaders). Bunny's CDN answers 403 to requests that arrive with no
  /// Referer at all, and ExoPlayer/AVPlayer send none by default, so without
  /// this every Bunny video would fail to load on device while playing fine in
  /// the browser. Any non-empty value is accepted by Bunny today; this is the
  /// real domain so it keeps working if a referrer allow-list is added later.
  static const siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://vallavan.in/',
  );

  /// Razorpay publishable key id (`rzp_test_…` / `rzp_live_…`). This is a
  /// PUBLIC key — safe to ship in the APK. The key *secret* must never be here.
  static const razorpayKeyId = String.fromEnvironment('RAZORPAY_KEY_ID');

  /// Opt in to real charges. Off unless built with
  /// `--dart-define=ALLOW_LIVE_PAYMENTS=true`.
  ///
  /// The NestJS backend refuses any non-`rzp_test_` key outright
  /// (payments.service.ts, wallet.service.ts). In-app checkout talks to
  /// Razorpay directly and never reaches that guard, so the same check is
  /// enforced here — with a deliberate escape hatch, since the mobile app is
  /// expected to take live payments eventually.
  static const allowLivePayments = bool.fromEnvironment('ALLOW_LIVE_PAYMENTS');

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

  /// True for a test-mode key. Mirrors the backend's predicate exactly, so a
  /// malformed or mistyped key id is treated as unsafe rather than assumed
  /// live-or-test.
  static bool get razorpayIsTestKey => razorpayKeyId.startsWith('rzp_test_');

  /// A key that would take real money, in a build that has not opted in.
  static bool get livePaymentsBlocked =>
      razorpayConfigured && !razorpayIsTestKey && !allowLivePayments;
  static bool get aiConfigured => hasBackend || anthropicKey.isNotEmpty;
}
