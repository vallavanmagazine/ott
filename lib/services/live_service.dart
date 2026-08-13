import '../models/live_slot.dart';
import 'supabase_client.dart';

class LiveService {
  static Future<List<LiveSlot>> fetchSchedule() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('live_slots').select().order('sort_order', ascending: true);
      return (data as List).map((r) => LiveSlot.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<bool> channelLive() async {
    final c = Db.client;
    if (c == null) return false;
    try {
      final r = await c.from('broadcast_config').select('channel_live').eq('id', 1).maybeSingle();
      return r?['channel_live'] == true;
    } catch (_) {
      return false;
    }
  }
}
