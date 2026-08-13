import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/notification.dart';
import '../services/notifications_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotification> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    NotificationsService.fetchAll().then((v) { if (mounted) setState(() { _items = v; _loading = false; }); });
  }

  IconData _icon(String t) => switch (t) {
        'episode' => Icons.play_circle_outline,
        'live' => Icons.live_tv,
        'sponsor' => Icons.local_offer_outlined,
        _ => Icons.info_outline,
      };
  Color _color(String t) => switch (t) {
        'sponsor' => AppColors.gold,
        'system' => const Color(0xFF1565C0),
        _ => AppColors.red,
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : _items.isEmpty
              ? const Center(child: Text('No notifications', style: TextStyle(color: AppColors.muted)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _items.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final n = _items[i];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: n.unread ? AppColors.glassStrong : AppColors.glass, borderRadius: BorderRadius.circular(14)),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Container(width: 36, height: 36, decoration: BoxDecoration(color: _color(n.type).withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)), child: Icon(_icon(n.type), color: _color(n.type), size: 18)),
                        const SizedBox(width: 12),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Row(children: [
                            Expanded(child: Text(n.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white))),
                            if (n.unread) Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.red, shape: BoxShape.circle)),
                          ]),
                          if (n.titleTa != null) Text(n.titleTa!, style: tamilStyle(size: 11)),
                          Padding(padding: const EdgeInsets.only(top: 4), child: Text(n.body, style: const TextStyle(fontSize: 12, color: AppColors.muted))),
                        ])),
                      ]),
                    );
                  },
                ),
    );
  }
}
