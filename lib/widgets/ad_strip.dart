import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/ad_content.dart';

/// Compact strip ad (feed top overlay / small placements).
class AdStrip extends StatelessWidget {
  final AdContent ad;
  final VoidCallback? onTap;
  const AdStrip({super.key, required this.ad, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.gold.withValues(alpha: 0.3))),
      child: Row(children: [
        Container(padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(3)),
          child: const Text('AD', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.black))),
        const SizedBox(width: 8),
        ClipRRect(borderRadius: BorderRadius.circular(8), child: CachedNetworkImage(imageUrl: pexelsUrl(ad.bgImage, w: 100), width: 32, height: 32, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 32, height: 32, color: AppColors.dark))),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Text(ad.sponsor, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.gold)),
          Text(ad.headline, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white)),
        ])),
        const SizedBox(width: 8),
        GestureDetector(onTap: onTap, child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
          child: Text(ad.cta, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)))),
      ]),
    );
  }
}
