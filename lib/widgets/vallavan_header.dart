import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../screens/search_screen.dart';
import '../screens/notifications_screen.dart';
import 'vallavan_logo.dart';

/// Shared top header: V logo + "VALLAVAN / DOCUMENTARIES THAT MATTER" on the
/// left, notification bell + search on the right. Solid dark background,
/// matching the web header. Shown on Home / Explore / Inspire.
class VallavanHeader extends StatelessWidget {
  final int notificationCount;
  const VallavanHeader({super.key, this.notificationCount = 0});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 12, 10),
      decoration: const BoxDecoration(
        color: AppColors.black,
        border: Border(bottom: BorderSide(color: Colors.white12)),
      ),
      child: Row(children: [
        const VallavanLogo(size: 34, showWordmark: true),
        const Spacer(),
        _iconButton(
          icon: Icons.notifications_none,
          badge: notificationCount,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
        ),
        const SizedBox(width: 4),
        _iconButton(
          icon: Icons.search,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen())),
        ),
      ]),
    );
  }

  Widget _iconButton({required IconData icon, required VoidCallback onTap, int badge = 0}) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 40, height: 40,
        child: Stack(alignment: Alignment.center, children: [
          Icon(icon, color: Colors.white, size: 22),
          if (badge > 0)
            Positioned(
              top: 6, right: 4,
              child: Container(
                padding: const EdgeInsets.all(3),
                constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
                decoration: const BoxDecoration(color: AppColors.red, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: Text('$badge', style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900)),
              ),
            ),
        ]),
      ),
    );
  }
}
