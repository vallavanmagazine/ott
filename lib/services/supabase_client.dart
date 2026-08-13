import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/env.dart';

/// Thin wrapper around the Supabase client. Returns null when unconfigured so
/// services can degrade gracefully (empty lists) instead of throwing.
class Db {
  static bool _inited = false;

  static Future<void> init() async {
    if (!Env.isConfigured || _inited) return;
    // ignore: deprecated_member_use
    await Supabase.initialize(url: Env.supabaseUrl, anonKey: Env.supabaseAnonKey);
    _inited = true;
  }

  static SupabaseClient? get client => _inited ? Supabase.instance.client : null;
}
