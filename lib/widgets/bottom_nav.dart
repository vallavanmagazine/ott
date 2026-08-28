import 'package:flutter/material.dart';
import '../config/theme.dart';
import 'vallavan_logo.dart';

/// Three-tab bottom navigation: Search | Feed (raised Vallavan logo) | Profile.
///
/// The centre button is taller than the bar, so the layout is a fixed-height
/// [Stack] with `clipBehavior: Clip.none` rather than a Row of Expanded cells —
/// otherwise the circle would be clipped at the bar's top edge.
class VallavanBottomNav extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const VallavanBottomNav({super.key, required this.index, required this.onTap});

  static const searchTab = 0;
  static const feedTab = 1;
  static const profileTab = 2;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.black,
        border: Border(top: BorderSide(color: Color(0x1AFFFFFF))),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 62,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Row(children: [
                Expanded(child: _sideTab(Icons.search_rounded, 'Search', searchTab)),
                const SizedBox(width: 74),
                Expanded(child: _sideTab(Icons.person_rounded, 'Profile', profileTab)),
              ]),
              Positioned(top: -14, child: _centreTab()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _sideTab(IconData icon, String label, int i) {
    final active = i == index;
    final color = active ? AppColors.red : AppColors.muted;
    return InkWell(
      onTap: () => onTap(i),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const SizedBox(height: 8),
        Icon(icon, size: 23, color: color),
        const SizedBox(height: 3),
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }

  Widget _centreTab() {
    final active = index == feedTab;
    return GestureDetector(
      onTap: () => onTap(feedTab),
      behavior: HitTestBehavior.opaque,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.black,
            border: Border.all(color: active ? AppColors.red : Colors.white24, width: 2),
            boxShadow: active
                ? [BoxShadow(color: AppColors.red.withValues(alpha: 0.45), blurRadius: 14, spreadRadius: 1)]
                : null,
          ),
          child: const VallavanLogo(size: 46, circle: true),
        ),
        const SizedBox(height: 2),
        Text('Feed', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: active ? AppColors.red : AppColors.muted)),
      ]),
    );
  }
}
