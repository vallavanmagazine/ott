import '../models/documentary.dart';
import 'supabase_client.dart';

class DocumentariesService {
  static Future<List<Documentary>> fetchAll() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('documentaries').select().order('created_at', ascending: false);
      return (data as List).map((r) => Documentary.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<Documentary?> fetchById(String id) async {
    final c = Db.client;
    if (c == null) return null;
    try {
      final r = await c.from('documentaries').select().eq('id', id).maybeSingle();
      return r == null ? null : Documentary.fromMap(r);
    } catch (_) {
      return null;
    }
  }

  static Future<List<Documentary>> related(String genre, String excludeId, {int limit = 8}) async {
    final all = await fetchAll();
    return all.where((d) => d.genre == genre && d.id != excludeId).take(limit).toList();
  }
}
