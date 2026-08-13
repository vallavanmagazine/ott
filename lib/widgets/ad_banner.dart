import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/ad_content.dart';

/// Sponsored banner (16:7) shown between content rows.
class AdBanner extends StatelessWidget {
  final AdContent ad;
  final VoidCallback? onTap;
  const AdBanner({super.key, required this.ad, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(
          aspectRatio: 16 / 7,
          child: Stack(fit: StackFit.expand, children: [
            CachedNetworkImage(imageUrl: pexelsUrl(ad.bgImage, w: 800), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
            const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.centerLeft, end: Alignment.centerRight, colors: [Colors.black87, Colors.black26]))),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Row(children: [
                  Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
                    child: const Text('SPONSORED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.black))),
                  const SizedBox(width: 8),
                  Text(ad.sponsor, style: const TextStyle(fontSize: 10, color: Colors.white70)),
                ]),
                Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(ad.headline, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
                  const SizedBox(height: 6),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
                    child: Text(ad.cta, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black))),
                ]),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
