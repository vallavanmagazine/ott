import '../models/notification.dart';
import 'supabase_client.dart';

class NotificationsService {
  static Future<List<AppNotification>> fetchAll() async {
    final c = Db.client;
    if (c == null) return const [];
    try {
      final data = await c.from('notifications').select().order('created_at', ascending: false).limit(100);
      return (data as List).map((r) => AppNotification.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return const [];
    }
  }

  static Future<int> unreadCount() async {
    final all = await fetchAll();
    return all.where((n) => n.unread).length;
  }

  /// Mark one notification read. Returns true when the write landed, so the
  /// caller can fall back to a local-only update if the row is read-only
  /// under RLS.
  static Future<bool> markRead(String id) async {
    final c = Db.client;
    if (c == null) return false;
    try {
      await c.from('notifications').update({'unread': false}).eq('id', id);
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<void> markAllRead() async {
    final c = Db.client;
    if (c == null) return;
    try {
      await c.from('notifications').update({'unread': false}).eq('unread', true);
    } catch (_) {
      // Non-fatal: the list still updates locally.
    }
  }
}
