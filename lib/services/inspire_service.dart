import '../models/inspire_item.dart';
import 'supabase_client.dart';

class InspireService {
  static Future<List<InspireItem>> fetchAll() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('inspire_items').select().order('created_at', ascending: false);
      return (data as List).map((r) => InspireItem.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }
}
