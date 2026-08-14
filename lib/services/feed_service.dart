import '../models/feed_reel.dart';
import 'supabase_client.dart';

class FeedService {
  static Future<List<FeedReel>> fetchAll() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('feed_reels').select().order('created_at', ascending: false); // FIX 3: latest first
      return (data as List).map((r) => FeedReel.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }
}
