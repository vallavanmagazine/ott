import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';

/// Auto-sliding hero (every 5s) with Watch Now.
class HeroCarousel extends StatefulWidget {
  final List<Documentary> items;
  final void Function(Documentary) onWatch;
  const HeroCarousel({super.key, required this.items, required this.onWatch});

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  final _controller = PageController();
  Timer? _timer;
  int _idx = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (widget.items.length < 2 || !_controller.hasClients) return;
      _idx = (_idx + 1) % widget.items.length;
      _controller.animateToPage(_idx, duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) return const SizedBox(height: 240);
    return SizedBox(
      height: 300,
      child: Stack(children: [
        PageView.builder(
          controller: _controller,
          onPageChanged: (i) => setState(() => _idx = i),
          itemCount: widget.items.length,
          itemBuilder: (_, i) {
            final d = widget.items[i];
            return Stack(fit: StackFit.expand, children: [
              CachedNetworkImage(imageUrl: pexelsUrl(d.backdrop, w: 1280), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
              const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, AppColors.black]))),
              Positioned(left: 16, right: 16, bottom: 24, child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: genreColor(d.genre), borderRadius: BorderRadius.circular(4)),
                  child: Text(d.genre.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white))),
                const SizedBox(height: 8),
                Text(d.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
                Text(d.titleTa, style: tamilStyle(size: 14)),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: () => widget.onWatch(d),
                  icon: const Icon(Icons.play_arrow, size: 18),
                  label: const Text('Watch Now'),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.red, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)), padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12)),
                ),
              ])),
            ]);
          },
        ),
        Positioned(
          bottom: 8, left: 0, right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.items.length, (i) => AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _idx ? 22 : 6,
                  height: 6,
                  decoration: BoxDecoration(color: i == _idx ? AppColors.red : Colors.white24, borderRadius: BorderRadius.circular(3)),
                )),
          ),
        ),
      ]),
    );
  }
}
