import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../models/notification.dart';
import '../services/documentaries_service.dart';
import '../services/notifications_service.dart';
import '../utils/formatters.dart';
import 'detail_screen.dart';
import 'live_tv_screen.dart';

/// Notification centre. Tapping a row marks it read and routes to the related
/// content; the unread badge in the header refreshes when this screen pops.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _items = [];
  bool _loading = true;

  /// Ids marked read in this session. Held locally so the UI stays correct
  /// even when the Supabase write is refused by RLS.
  final Set<String> _readLocally = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await NotificationsService.fetchAll();
    if (mounted) setState(() { _items = list; _loading = false; });
  }

  bool _isUnread(AppNotification n) => n.unread && !_readLocally.contains(n.id);

  Future<void> _open(AppNotification n) async {
    if (_isUnread(n)) {
      setState(() => _readLocally.add(n.id));
      await NotificationsService.markRead(n.id);
    }
    if (!mounted) return;

    if (n.type == 'live') {
      Navigator.push(context, MaterialPageRoute<void>(builder: (_) => const LiveTvScreen()));
      return;
    }
    // Episode notifications carry a content title; resolve it to a documentary
    // when one matches, otherwise the row is informational only.
    final docs = await DocumentariesService.fetchAll();
    if (!mounted) return;
    Documentary? match;
    for (final d in docs) {
      if (d.title == n.title || d.titleTa == n.titleTa) { match = d; break; }
    }
    if (match != null) {
      Navigator.push(context, MaterialPageRoute<void>(builder: (_) => DetailScreen(item: match!)));
    }
  }

  Future<void> _markAll() async {
    setState(() => _readLocally.addAll(_items.map((n) => n.id)));
    await NotificationsService.markAllRead();
  }

  static IconData _icon(String type) => switch (type) {
        'live' => Icons.live_tv_rounded,
        'episode' => Icons.play_circle_outline,
        'sponsor' => Icons.campaign_outlined,
        _ => Icons.notifications_none_rounded,
      };

  @override
  Widget build(BuildContext context) {
    final unread = _items.where(_isUnread).length;
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        backgroundColor: AppColors.black,
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w900)),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: _markAll,
              child: const Text('Mark all read',
                  style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : _items.isEmpty
              ? const Center(child: Text('No notifications yet', style: TextStyle(color: AppColors.muted)))
              : RefreshIndicator(
                  color: AppColors.red,
                  backgroundColor: AppColors.dark,
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    itemBuilder: (_, i) => _row(_items[i]),
                  ),
                ),
    );
  }

  Widget _row(AppNotification n) {
    final unread = _isUnread(n);
    return GestureDetector(
      onTap: () => _open(n),
      behavior: HitTestBehavior.opaque,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: unread ? AppColors.glassStrong : AppColors.glass,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: unread ? AppColors.red.withValues(alpha: 0.35) : Colors.white10),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: (unread ? AppColors.red : AppColors.muted).withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(_icon(n.type), size: 17, color: unread ? AppColors.red : AppColors.muted),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                n.titleTa != null && n.titleTa!.isNotEmpty ? n.titleTa! : n.title,
                style: tamilStyle(
                    size: 14,
                    color: Colors.white,
                    weight: unread ? FontWeight.bold : FontWeight.w500),
              ),
              if (n.titleTa != null && n.titleTa!.isNotEmpty && n.title.isNotEmpty)
                Text(n.title, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
              if (n.body.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text(n.body,
                      style: const TextStyle(fontSize: 12, color: AppColors.muted, height: 1.35)),
                ),
              Padding(
                padding: const EdgeInsets.only(top: 5),
                child: Text(formatDate(n.createdAt),
                    style: const TextStyle(fontSize: 10, color: AppColors.muted)),
              ),
            ]),
          ),
          if (unread)
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: 4, left: 6),
              decoration: const BoxDecoration(color: AppColors.red, shape: BoxShape.circle),
            ),
        ]),
      ),
    );
  }
}
