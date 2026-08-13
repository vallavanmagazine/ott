import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../config/theme.dart';

class LoadingSkeleton extends StatelessWidget {
  final double width;
  final double height;
  final double radius;
  const LoadingSkeleton({super.key, this.width = double.infinity, this.height = 16, this.radius = 8});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.dark,
      highlightColor: const Color(0xFF222222),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(radius)),
      ),
    );
  }
}

/// A row of card placeholders.
class RowSkeleton extends StatelessWidget {
  const RowSkeleton({super.key});
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 160,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, __) => const LoadingSkeleton(width: 220, height: 150, radius: 14),
      ),
    );
  }
}
