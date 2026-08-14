import 'supabase_client.dart';

/// Admin-managed category chips (FIX 4). Reads active display names for a
/// section from content_categories; falls back to the provided defaults.
class CategoriesService {
  static Future<List<String>> fetchNames(String section, {List<String> fallback = const []}) async {
    final c = Db.client;
    if (c == null) return fallback;
    try {
      final data = await c
          .from('content_categories')
          .select('display_name, is_active')
          .eq('section', section)
          .order('sort_order', ascending: true);
      final names = (data as List)
          .where((r) => r['is_active'] != false)
          .map((r) => (r['display_name'] ?? '').toString())
          .where((s) => s.isNotEmpty)
          .toList();
      return names.isEmpty ? fallback : names;
    } catch (_) {
      return fallback;
    }
  }
}
