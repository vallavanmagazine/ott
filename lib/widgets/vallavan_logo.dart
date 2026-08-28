import 'package:flutter/material.dart';
import '../config/theme.dart';

/// The Vallavan brand mark. Renders the shipped PNG icon and falls back to a
/// drawn red/gold badge if the asset ever fails to decode, so the header can
/// never show a broken-image box.
class VallavanLogo extends StatelessWidget {
  final double size;
  final bool showWordmark;
  final bool circle;
  const VallavanLogo({super.key, this.size = 40, this.showWordmark = false, this.circle = false});

  @override
  Widget build(BuildContext context) {
    final radius = circle ? size / 2 : size * 0.28;
    final mark = ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: Image.asset(
        'assets/vallavanicon.png',
        width: size,
        height: size,
        fit: BoxFit.cover,
        filterQuality: FilterQuality.medium,
        errorBuilder: (_, __, ___) => _fallback(radius),
      ),
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

  Widget _fallback(double radius) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppColors.red, AppColors.redLight], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(radius),
        ),
        alignment: Alignment.center,
        child: Text('V', style: TextStyle(fontSize: size * 0.55, fontWeight: FontWeight.w900, color: AppColors.gold)),
      );
}
