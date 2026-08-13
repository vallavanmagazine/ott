import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Simple Vallavan mark (red rounded badge with a gold "V") + optional wordmark.
class VallavanLogo extends StatelessWidget {
  final double size;
  final bool showWordmark;
  const VallavanLogo({super.key, this.size = 40, this.showWordmark = false});

  @override
  Widget build(BuildContext context) {
    final mark = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [AppColors.red, AppColors.redLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: [BoxShadow(color: AppColors.red.withValues(alpha: 0.4), blurRadius: size * 0.4)],
      ),
      alignment: Alignment.center,
      child: Text('V', style: TextStyle(fontSize: size * 0.55, fontWeight: FontWeight.w900, color: AppColors.gold)),
    );
    if (!showWordmark) return mark;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      mark,
      const SizedBox(width: 8),
      const Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
        Text('VALLAVAN', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: Colors.white)),
        Text('Documentaries That Matter', style: TextStyle(fontSize: 7, letterSpacing: 1.8, color: AppColors.muted, fontWeight: FontWeight.w500)),
      ]),
    ]);
  }
}
