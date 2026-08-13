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

  static bool get isConfigured => supabaseAnonKey.isNotEmpty;
}
