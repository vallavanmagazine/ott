import 'package:flutter/material.dart';
import '../config/theme.dart';

class VallavanBottomNav extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;
  const VallavanBottomNav({super.key, required this.index, required this.onTap});

  static const _items = [
    (Icons.home_rounded, 'Home'),
    (Icons.article_rounded, 'Feed'),
    (Icons.explore_rounded, 'Explore'),
    (Icons.auto_awesome_rounded, 'Inspire'),
    (Icons.person_rounded, 'Profile'),
  ];

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
          height: 58,
          child: Row(
            children: List.generate(_items.length, (i) {
              final active = i == index;
              final color = active ? AppColors.red : AppColors.muted;
              return Expanded(
                child: InkWell(
                  onTap: () => onTap(i),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(_items[i].$1, size: 22, color: color),
                    const SizedBox(height: 2),
                    Text(_items[i].$2, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
                  ]),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
