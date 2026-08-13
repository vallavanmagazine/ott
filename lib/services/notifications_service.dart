import '../models/notification.dart';
import 'supabase_client.dart';

class NotificationsService {
  static Future<List<AppNotification>> fetchAll() async {
    final c = Db.client;
    if (c == null) return [];
    try {
      final data = await c.from('notifications').select().order('created_at', ascending: false);
      return (data as List).map((r) => AppNotification.fromMap(r as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<int> unreadCount() async {
    final all = await fetchAll();
    return all.where((n) => n.unread).length;
  }
}
