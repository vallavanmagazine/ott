import '../models/search_hit.dart';
import 'documentaries_service.dart';
import 'feed_service.dart';
import 'supabase_client.dart';

/// Search index + trending terms. Both sources are fetched once and filtered
/// in memory so typing filters instantly with no per-keystroke network call.
class SearchService {
  static Future<List<SearchHit>> fetchIndex() async {
    // Kicked off together, awaited separately — Future.wait would collapse the
    // two element types into a common supertype and force a cast back out.
    final docsFuture = DocumentariesService.fetchAll();
    final reelsFuture = FeedService.fetchAll();
    final docs = await docsFuture;
    final reels = await reelsFuture;
    return [
      ...docs.map(SearchHit.fromDoc),
      ...reels.map(SearchHit.fromReel),
    ];
  }

  static Future<List<String>> fetchTrending() async {
    final c = Db.client;
    if (c == null) return const [];
    try {
      final data = await c.from('trending_searches').select('term').order('sort_order');
      return (data as List).map((e) => e['term'].toString()).toList();
    } catch (_) {
      return const [];
    }
  }
}
