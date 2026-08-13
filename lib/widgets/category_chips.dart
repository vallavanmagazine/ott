import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Horizontal filter chips (used for genres, inspire categories, feed types).
class FilterChipsBar extends StatelessWidget {
  final List<String> options;
  final String active;
  final ValueChanged<String> onSelected;
  const FilterChipsBar({super.key, required this.options, required this.active, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: options.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final o = options[i];
          final sel = o == active;
          return GestureDetector(
            onTap: () => onSelected(o),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: sel ? AppColors.red : AppColors.glass,
                borderRadius: BorderRadius.circular(999),
              ),
              alignment: Alignment.center,
              child: Text(o, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: sel ? Colors.white : AppColors.muted)),
            ),
          );
        },
      ),
    );
  }
}
