import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../models/live_slot.dart';
import '../services/documentaries_service.dart';
import '../services/live_service.dart';
import '../services/preferences_service.dart';
import '../widgets/vallavan_logo.dart';

class LiveTvScreen extends StatefulWidget {
  const LiveTvScreen({super.key});
  @override
  State<LiveTvScreen> createState() => _LiveTvScreenState();
}

class _LiveTvScreenState extends State<LiveTvScreen> {
  List<LiveSlot> _schedule = [];
  List<Documentary> _docs = [];

  @override
  void initState() {
    super.initState();
    LiveService.fetchSchedule().then((s) { if (mounted) setState(() => _schedule = s); });
    DocumentariesService.fetchAll().then((d) { if (mounted) setState(() => _docs = d); });
  }

  @override
  Widget build(BuildContext context) {
    // Mobile shows Coming Soon promo mode (playout is web/server only for now).
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Live TV', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: ListView(children: [
        Padding(padding: const EdgeInsets.all(16), child: ClipRRect(borderRadius: BorderRadius.circular(16), child: Stack(children: [
          _PromoReel(docs: _docs),
          Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black.withValues(alpha: 0.4), Colors.black.withValues(alpha: 0.85)])))),
          Positioned.fill(child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            const VallavanLogo(size: 64),
            const SizedBox(height: 12),
            Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(999)), child: const Text('LAUNCHING SOON', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black))),
            const SizedBox(height: 12),
            const _PulseText(),
            const SizedBox(height: 6),
            const Text('24/7 Tamil Documentaries, News, Events & More', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: AppColors.muted)),
          ]))),
        ]))),
        const _GetNotified(),
        const Padding(padding: EdgeInsets.fromLTRB(16, 20, 16, 10), child: Text('Upcoming Schedule Preview', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white))),
        ..._schedule.map((s) => Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4), child: Container(
          padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            ClipRRect(borderRadius: BorderRadius.circular(8), child: CachedNetworkImage(imageUrl: pexelsUrl(s.thumb, w: 200), width: 64, height: 44, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 64, height: 44, color: AppColors.black))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text('${s.time} · ${s.duration}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
              Text(s.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
            ])),
            Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)), child: const Text('SOON', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.gold))),
          ]),
        ))),
        const SizedBox(height: 24),
      ]),
    );
  }
}

class _PulseText extends StatefulWidget {
  const _PulseText();
  @override
  State<_PulseText> createState() => _PulseTextState();
}

class _PulseTextState extends State<_PulseText> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  @override
  void dispose() { _c.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) => FadeTransition(opacity: Tween(begin: 0.5, end: 1.0).animate(_c), child: const Text('COMING SOON', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white)));
}

class _PromoReel extends StatefulWidget {
  final List<Documentary> docs;
  const _PromoReel({required this.docs});
  @override
  State<_PromoReel> createState() => _PromoReelState();
}

class _PromoReelState extends State<_PromoReel> {
  int _i = 0;
  Timer? _t;
  @override
  void initState() {
    super.initState();
    _t = Timer.periodic(const Duration(milliseconds: 2500), (_) { if (widget.docs.isNotEmpty && mounted) setState(() => _i = (_i + 1) % widget.docs.length); });
  }
  @override
  void dispose() { _t?.cancel(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return AspectRatio(aspectRatio: 16 / 10, child: widget.docs.isEmpty
        ? Container(color: AppColors.dark)
        : AnimatedSwitcher(duration: const Duration(milliseconds: 800), child: CachedNetworkImage(key: ValueKey(_i), imageUrl: pexelsUrl(widget.docs[_i].poster, w: 1280), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark))));
  }
}

class _GetNotified extends StatefulWidget {
  const _GetNotified();
  @override
  State<_GetNotified> createState() => _GetNotifiedState();
}

class _GetNotifiedState extends State<_GetNotified> {
  final _ctrl = TextEditingController();
  bool _done = false;
  @override
  void initState() { super.initState(); Prefs.hasLiveNotify().then((v) { if (mounted) setState(() => _done = v); }); }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Container(
      padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
      child: _done
          ? const Row(children: [Icon(Icons.check_circle, color: Colors.green), SizedBox(width: 8), Expanded(child: Text("You're on the list — we'll notify you at launch!", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)))])
          : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Get notified when we go live', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: TextField(controller: _ctrl, style: const TextStyle(color: Colors.white), decoration: InputDecoration(hintText: 'you@email.com', hintStyle: const TextStyle(color: AppColors.muted), filled: true, fillColor: AppColors.glass, border: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10)))),
                const SizedBox(width: 8),
                FilledButton(onPressed: () async { if (_ctrl.text.contains('@')) { await Prefs.setLiveNotify(_ctrl.text); if (mounted) setState(() => _done = true); } }, style: FilledButton.styleFrom(backgroundColor: AppColors.red), child: const Text('Notify Me')),
              ]),
            ]),
    ));
  }
}
