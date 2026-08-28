import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../screens/live_tv_screen.dart';
import '../screens/notifications_screen.dart';
import '../services/notifications_service.dart';
import 'vallavan_logo.dart';

/// Shared top bar shown on every tab:
///
///   [icon] VALLAVAN            📺 Live TV   📡 Cast   🔔 (unread)
///
/// The unread badge is fetched on mount and refreshed whenever the user
/// returns from the notifications screen, so tapping "mark as read" there is
/// reflected here without a full app reload.
class VallavanHeader extends StatefulWidget {
  const VallavanHeader({super.key});

  @override
  State<VallavanHeader> createState() => _VallavanHeaderState();
}

class _VallavanHeaderState extends State<VallavanHeader> {
  int _unread = 0;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    final n = await NotificationsService.unreadCount();
    if (mounted) setState(() => _unread = n);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
      decoration: const BoxDecoration(
        color: AppColors.black,
        border: Border(bottom: BorderSide(color: Colors.white12)),
      ),
      child: SafeArea(
        bottom: false,
        child: Row(children: [
          const VallavanLogo(size: 32),
          const SizedBox(width: 8),
          const Text('VALLAVAN',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, letterSpacing: 1.4, color: Colors.white)),
          const Spacer(),
          _iconButton(
            icon: Icons.live_tv_rounded,
            tooltip: 'Live TV',
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LiveTvScreen())),
          ),
          _iconButton(
            icon: Icons.cast_rounded,
            tooltip: 'Cast',
            onTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Casting is coming soon.'), duration: Duration(seconds: 2)),
            ),
          ),
          _iconButton(
            icon: Icons.notifications_none_rounded,
            tooltip: 'Notifications',
            badge: _unread,
            onTap: () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
              _refresh();
            },
          ),
        ]),
      ),
    );
  }

  Widget _iconButton({
    required IconData icon,
    required VoidCallback onTap,
    required String tooltip,
    int badge = 0,
  }) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: 42,
          height: 42,
          child: Stack(alignment: Alignment.center, children: [
            Icon(icon, color: Colors.white, size: 22),
            if (badge > 0)
              Positioned(
                top: 6,
                right: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                  decoration: BoxDecoration(
                    color: AppColors.red,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.black, width: 1.5),
                  ),
                  alignment: Alignment.center,
                  child: Text(badge > 99 ? '99+' : '$badge',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900)),
                ),
              ),
          ]),
        ),
      ),
    );
  }
}
