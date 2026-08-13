import '../models/ad_content.dart';
import 'supabase_client.dart';

class ServedAd {
  final AdContent ad;
  final String? campaignId;
  const ServedAd(this.ad, this.campaignId);
}

/// Geo-targeted ad selection + tracking (mirrors the web ad-engine).
/// Cascade: district → statewide → any ad → house ad. Rotation: fewest impressions first.
class AdEngine {
  static ServedAd houseAd() => const ServedAd(AdContent.house, null);

  static Future<List<ServedAd>> _candidates(String district) async {
    final c = Db.client;
    if (c == null) return [houseAd()];
    try {
      // 1) district-targeted active campaigns
      final geo = await c.from('campaigns').select('id').eq('status', 'Active').contains('target_districts', [district]);
      var ids = (geo as List).map((e) => e['id'].toString()).toList();

      // 2) statewide (empty target_districts)
      if (ids.isEmpty) {
        final state = await c.from('campaigns').select('id, target_districts').eq('status', 'Active');
        ids = (state as List)
            .where((e) => (e['target_districts'] as List?)?.isEmpty ?? true)
            .map((e) => e['id'].toString())
            .toList();
      }

      if (ids.isNotEmpty) {
        final data = await c.from('ads').select().inFilter('campaign_id', ids);
        final list = (data as List).map((r) => ServedAd(AdContent.fromMap(r as Map<String, dynamic>), (r)['campaign_id']?.toString())).toList();
        if (list.isNotEmpty) return await _orderByFewest(list);
      }

      // 3) any ad
      final anyAds = await c.from('ads').select().limit(20);
      final list = (anyAds as List).map((r) => ServedAd(AdContent.fromMap(r as Map<String, dynamic>), (r)['campaign_id']?.toString())).toList();
      if (list.isNotEmpty) return await _orderByFewest(list);
    } catch (_) {}
    return [houseAd()];
  }

  static Future<List<ServedAd>> _orderByFewest(List<ServedAd> cands) async {
    final c = Db.client;
    if (c == null || cands.length <= 1) return cands;
    try {
      final ids = cands.map((s) => s.ad.id).where((id) => id != AdContent.house.id).toList();
      final data = await c.from('ad_events').select('ad_id').eq('kind', 'impression').inFilter('ad_id', ids);
      final counts = <String, int>{};
      for (final e in data as List) {
        final id = e['ad_id'].toString();
        counts[id] = (counts[id] ?? 0) + 1;
      }
      final sorted = [...cands]..sort((a, b) => (counts[a.ad.id] ?? 0).compareTo(counts[b.ad.id] ?? 0));
      return sorted;
    } catch (_) {
      return cands;
    }
  }

  static Future<ServedAd> getVideoAd(String district, {List<String> exclude = const []}) async {
    final cands = (await _candidates(district)).where((c) => !exclude.contains(c.ad.id)).toList();
    return cands.isEmpty ? houseAd() : cands.first;
  }

  static Future<ServedAd> getOverlayAd(String district, {List<String> exclude = const []}) async {
    final cands = (await _candidates(district)).where((c) => !exclude.contains(c.ad.id)).toList();
    if (cands.isEmpty) return houseAd();
    return cands.length > 1 ? cands[1] : cands.first;
  }

  static Future<void> _track(String kind, String? adId, String? campaignId, String district, String slot) async {
    final c = Db.client;
    if (c == null || adId == null || adId == AdContent.house.id) return;
    try {
      await c.from('ad_events').insert({'ad_id': adId, 'campaign_id': campaignId, 'district': district, 'kind': kind, 'placement': slot});
    } catch (_) {}
  }

  static Future<void> trackImpression(String? adId, String? campaignId, String district, String slot) =>
      _track('impression', adId, campaignId, district, slot);

  static Future<void> trackClick(String? adId, String? campaignId, String district, String slot) =>
      _track('click', adId, campaignId, district, slot);
}
