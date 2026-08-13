import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../services/ad_engine.dart';

/// Full-stage pre/mid-roll ad card (image creative for the countdown window).
class AdOverlay extends StatelessWidget {
  final ServedAd served;
  final bool isMidRoll;
  final int countdown;
  final VoidCallback onSkip;
  final VoidCallback onCta;
  const AdOverlay({super.key, required this.served, required this.isMidRoll, required this.countdown, required this.onSkip, required this.onCta});

  @override
  Widget build(BuildContext context) {
    final ad = served.ad;
    final canSkip = isMidRoll || countdown <= 0;
    return Stack(fit: StackFit.expand, children: [
      CachedNetworkImage(imageUrl: pexelsUrl(ad.bgImage, w: 800), fit: BoxFit.cover, color: Colors.black45, colorBlendMode: BlendMode.darken, errorWidget: (_, __, ___) => Container(color: Colors.black)),
      Positioned(top: 8, left: 8, child: Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
        child: Text('${isMidRoll ? 'Mid-roll Ad' : 'Ad'}${countdown > 0 ? ' · ${countdown}s' : ''}', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.black)))),
      Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(ad.sponsor, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gold)),
        Text(ad.headline, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white)),
        const SizedBox(height: 8),
        GestureDetector(onTap: onCta, child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
          child: Text(ad.cta, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)))),
      ])),
      Positioned(bottom: 12, right: 12, child: TextButton(
        onPressed: canSkip ? onSkip : null,
        style: TextButton.styleFrom(backgroundColor: AppColors.glassStrong, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
        child: Text(canSkip ? 'Skip Ad ›' : 'Skip ${countdown}s'),
      )),
    ]);
  }
}
