import '../models/ad_content.dart';
import 'supabase_client.dart';

class AdsService {
  static Future<List<AdContent>> fetchAll() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('ads').select().order('created_at', ascending: false);
      return (data as List).map((r) => AdContent.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }
}
