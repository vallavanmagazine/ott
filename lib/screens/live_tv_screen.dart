import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/ad_content.dart';
import '../models/documentary.dart';
import '../models/live_slot.dart';
import '../services/ads_service.dart';
import '../services/broadcast_service.dart';
import '../services/documentaries_service.dart';
import '../services/live_service.dart';
import '../services/preferences_service.dart';
import '../widgets/ad_banner.dart';
import '../widgets/vallavan_logo.dart';
import 'video_player_screen.dart';

/// Live TV, opened from the header. Renders the live channel when
/// `broadcast_config.channel_live` is true, and a Coming Soon promo otherwise.
///
/// Layout rule: only the LIVE badge, channel bug and play button sit *on* the
/// picture. Now/next, controls, weather, ticker and the sponsor ad each get
/// their own full-width row below it — nothing is stacked on top of anything.
class LiveTvScreen extends StatefulWidget {
  const LiveTvScreen({super.key});
  @override
  State<LiveTvScreen> createState() => _LiveTvScreenState();
}

class _LiveTvScreenState extends State<LiveTvScreen> {
  BroadcastConfig? _config;
  List<LiveSlot> _schedule = [];
  List<Documentary> _docs = [];
  List<AdContent> _ads = [];
  Weather? _weather;
  List<TickerItem> _ticker = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final config = await BroadcastService.fetchConfig();
    if (!mounted) return;
    setState(() => _config = config);

    final schedule = await LiveService.fetchSchedule();
    final docs = await DocumentariesService.fetchAll();
    final ads = await AdsService.fetchAll();
    if (!mounted) return;
    setState(() {
      _schedule = schedule;
      _docs = docs;
      _ads = ads;
    });

    if (config.weatherEnabled) {
      final w = await BroadcastService.fetchWeather(config.weatherCity);
      if (mounted) setState(() => _weather = w);
    }
    if (config.tickerEnabled) {
      final t = await BroadcastService.fetchTicker();
      if (mounted) setState(() => _ticker = t);
    }
  }

  /// The on-air slot, falling back to the first of the day when nothing is
  /// flagged live. `firstOrNull` lives in package:collection, so this walks the
  /// list directly rather than adding a dependency for one call.
  LiveSlot? get _now {
    for (final s in _schedule) {
      if (s.isLive) return s;
    }
    return _schedule.isNotEmpty ? _schedule.first : null;
  }

  LiveSlot? get _next {
    final now = _now;
    if (now == null || _schedule.length < 2) return null;
    final i = _schedule.indexOf(now);
    return (i >= 0 && i + 1 < _schedule.length) ? _schedule[i + 1] : _schedule[1];
  }

  /// The live channel plays the currently scheduled programme. A synthetic
  /// Documentary with the reserved 'live-player' id keeps it out of history.
  void _watchLive() {
    final slot = _now;
    if (slot == null) return;
    final item = Documentary(
      id: 'live-player',
      title: slot.title,
      titleTa: slot.titleTa,
      genre: 'Society',
      durationSec: slot.durationMin * 60,
      poster: slot.thumb,
      backdrop: slot.thumb,
      year: DateTime.now().year,
      language: 'Tamil',
      synopsis: slot.description,
      synopsisTa: '',
      videoUrl: slot.videoUrl,
    );
    Navigator.push(context, MaterialPageRoute<void>(builder: (_) => VideoPlayerScreen(item: item)));
  }

  @override
  Widget build(BuildContext context) {
    final cfg = _config;
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Live TV', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      body: cfg == null
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : (cfg.channelLive ? _liveBody(cfg) : _comingSoonBody()),
    );
  }

  // -------------------------------------------------------------- LIVE mode

  Widget _liveBody(BroadcastConfig cfg) {
    final now = _now;
    return ListView(padding: const EdgeInsets.only(bottom: 28), children: [
      _videoArea(now),
      if (cfg.breakingActive && cfg.breakingHeadline.isNotEmpty) _breaking(cfg),
      _nowNext(now),
      _controlsBar(),
      if (cfg.weatherEnabled && _weather != null) _weatherStrip(_weather!),
      if (cfg.tickerEnabled && _ticker.isNotEmpty) _NewsTicker(items: _ticker),
      if (_ads.isNotEmpty)
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: AdBanner(ad: _ads[_ads.length > 1 ? 1 : 0]),
        ),
      _scheduleList(),
    ]);
  }

  /// Picture with only three overlaid elements, each pinned to its own corner.
  Widget _videoArea(LiveSlot? now) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Stack(fit: StackFit.expand, children: [
        if (now != null)
          CachedNetworkImage(
            imageUrl: pexelsUrl(now.thumb, w: 1280),
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => Container(color: AppColors.dark),
          )
        else
          Container(color: AppColors.dark),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.black45, Colors.transparent, Colors.black54],
            ),
          ),
        ),
        const Positioned(top: 10, left: 12, child: _LiveBadge()),
        const Positioned(top: 10, right: 12, child: VallavanLogo(size: 30, circle: true)),
        Center(
          child: GestureDetector(
            onTap: _watchLive,
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.red.withValues(alpha: 0.92),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: AppColors.red.withValues(alpha: 0.5), blurRadius: 20)],
              ),
              child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 36),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _breaking(BroadcastConfig cfg) => Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.red.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.red.withValues(alpha: 0.5)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('BREAKING',
              style: TextStyle(fontSize: 9, letterSpacing: 1.4, fontWeight: FontWeight.w900, color: AppColors.red)),
          const SizedBox(height: 4),
          Text(cfg.breakingHeadline,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
          if (cfg.breakingBody.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(cfg.breakingBody, style: const TextStyle(color: Colors.white70, fontSize: 12)),
            ),
        ]),
      );

  Widget _nowNext(LiveSlot? now) {
    if (now == null) return const SizedBox.shrink();
    final next = _next;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('NOW PLAYING',
            style: TextStyle(fontSize: 9, letterSpacing: 1.4, color: AppColors.red, fontWeight: FontWeight.w900)),
        const SizedBox(height: 3),
        Text(now.titleTa.isNotEmpty ? now.titleTa : now.title,
            style: tamilStyle(size: 17, color: Colors.white, weight: FontWeight.bold)),
        if (now.titleTa.isNotEmpty)
          Text(now.title, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
        if (next != null) ...[
          const SizedBox(height: 10),
          Row(children: [
            const Text('NEXT',
                style: TextStyle(fontSize: 9, letterSpacing: 1.4, color: AppColors.gold, fontWeight: FontWeight.w900)),
            const SizedBox(width: 8),
            Expanded(
              child: Text('${next.time} · ${next.title}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Colors.white70)),
            ),
          ]),
        ],
      ]),
    );
  }

  Widget _controlsBar() => Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
        child: Row(children: [
          Expanded(
            child: SizedBox(
              height: 44,
              child: FilledButton.icon(
                onPressed: _watchLive,
                icon: const Icon(Icons.play_arrow_rounded, size: 18),
                label: const Text('Watch Live', style: TextStyle(fontWeight: FontWeight.bold)),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.red,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          _roundButton(Icons.volume_up, 'Volume', _watchLive),
          const SizedBox(width: 8),
          _roundButton(Icons.fullscreen, 'Fullscreen', _watchLive),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _showGuide(),
            child: Container(
              height: 44,
              padding: const EdgeInsets.symmetric(horizontal: 14),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(999)),
              child: const Text('Guide',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ]),
      );

  Widget _roundButton(IconData icon, String tooltip, VoidCallback onTap) => Tooltip(
        message: tooltip,
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(color: AppColors.glass, shape: BoxShape.circle),
            child: Icon(icon, size: 18, color: Colors.white),
          ),
        ),
      );

  void _showGuide() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.dark,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
      builder: (_) => SafeArea(
        child: ListView(shrinkWrap: true, padding: const EdgeInsets.all(16), children: [
          const Text('Program Guide',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16)),
          const SizedBox(height: 12),
          if (_schedule.isEmpty)
            const Text('Schedule not available.', style: TextStyle(color: AppColors.muted))
          else
            ..._schedule.map((s) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  leading: Text(s.time,
                      style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold)),
                  title: Text(s.title, style: const TextStyle(color: Colors.white, fontSize: 13)),
                  subtitle: Text(s.duration, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
                )),
        ]),
      ),
    );
  }

  /// One-line weather strip: temperature + conditions.
  Widget _weatherStrip(Weather w) => Container(
        margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(10)),
        child: Row(children: [
          const Icon(Icons.wb_sunny_outlined, size: 16, color: AppColors.gold),
          const SizedBox(width: 10),
          Text('${w.tempC}°C',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14)),
          const SizedBox(width: 8),
          Expanded(
            child: Text('${w.label} · ${w.day}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: AppColors.muted, fontSize: 12)),
          ),
        ]),
      );

  Widget _scheduleList() => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 22, 16, 4),
          child: Text("Today's Schedule",
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
        ),
        if (_schedule.isEmpty)
          const Padding(
            padding: EdgeInsets.all(20),
            child: Center(child: Text('Schedule coming soon', style: TextStyle(color: AppColors.muted))),
          )
        else
          ..._schedule.map((s) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(12)),
                  child: Row(children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: pexelsUrl(s.thumb, w: 200),
                        width: 64,
                        height: 44,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(width: 64, height: 44, color: AppColors.black),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('${s.time} · ${s.duration}',
                                style: const TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gold)),
                            Text(s.titleTa.isNotEmpty ? s.titleTa : s.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: tamilStyle(size: 13, color: Colors.white, weight: FontWeight.bold)),
                          ]),
                    ),
                    if (s.isLive) const _LiveBadge(),
                  ]),
                ),
              )),
      ]);

  // ------------------------------------------------------- COMING SOON mode

  Widget _comingSoonBody() => ListView(children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(children: [
              _PromoReel(docs: _docs),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.black.withValues(alpha: 0.4), Colors.black.withValues(alpha: 0.88)],
                    ),
                  ),
                ),
              ),
              Positioned.fill(
                child: Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const VallavanLogo(size: 64, circle: true),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(999)),
                      child: const Text('LAUNCHING SOON',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black)),
                    ),
                    const SizedBox(height: 12),
                    const _PulseText(),
                    const SizedBox(height: 6),
                    const Text('24/7 Tamil Documentaries, News, Events & More',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 13, color: AppColors.muted)),
                  ]),
                ),
              ),
            ]),
          ),
        ),
        const _GetNotified(),
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 22, 16, 6),
          child: Text('Upcoming Schedule Preview',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
        ),
        ..._schedule.map((s) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: pexelsUrl(s.thumb, w: 200),
                      width: 64,
                      height: 44,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(width: 64, height: 44, color: AppColors.black),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child:
                        Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                      Text('${s.time} · ${s.duration}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                      Text(s.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                    ]),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
                    child: const Text('SOON',
                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.gold)),
                  ),
                ]),
              ),
            )),
        const SizedBox(height: 24),
      ]);
}

class _LiveBadge extends StatelessWidget {
  const _LiveBadge();
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: AppColors.red, borderRadius: BorderRadius.circular(4)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 5,
            height: 5,
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          const Text('LIVE',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1, color: Colors.white)),
        ]),
      );
}

/// Continuously scrolling one-line news ticker. The text row is rendered twice
/// so the wrap-around seam is never visible.
class _NewsTicker extends StatefulWidget {
  final List<TickerItem> items;
  const _NewsTicker({required this.items});
  @override
  State<_NewsTicker> createState() => _NewsTickerState();
}

class _NewsTickerState extends State<_NewsTicker> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 24))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final text = widget.items.map((t) => t.text).join('     •     ');
    final width = MediaQuery.of(context).size.width;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 10, 16, 0),
      height: 34,
      decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(10)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Row(children: [
          Container(
            height: 34,
            padding: const EdgeInsets.symmetric(horizontal: 10),
            alignment: Alignment.center,
            color: AppColors.red,
            child: const Text('NEWS',
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1, color: Colors.white)),
          ),
          Expanded(
            child: AnimatedBuilder(
              animation: _c,
              builder: (_, __) => Transform.translate(
                offset: Offset(-_c.value * width * 1.6, 0),
                child: Row(children: [
                  SizedBox(width: width),
                  Text(text, maxLines: 1, style: const TextStyle(color: Colors.white, fontSize: 12)),
                  SizedBox(width: width * 0.6),
                  Text(text, maxLines: 1, style: const TextStyle(color: Colors.white, fontSize: 12)),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }
}

class _PulseText extends StatefulWidget {
  const _PulseText();
  @override
  State<_PulseText> createState() => _PulseTextState();
}

class _PulseTextState extends State<_PulseText> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
        opacity: Tween<double>(begin: 0.5, end: 1.0).animate(_c),
        child: const Text('COMING SOON',
            style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.white)),
      );
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
    _t = Timer.periodic(const Duration(milliseconds: 2500), (_) {
      if (widget.docs.isNotEmpty && mounted) setState(() => _i = (_i + 1) % widget.docs.length);
    });
  }

  @override
  void dispose() {
    _t?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AspectRatio(
        aspectRatio: 16 / 10,
        child: widget.docs.isEmpty
            ? Container(color: AppColors.dark)
            : AnimatedSwitcher(
                duration: const Duration(milliseconds: 800),
                child: CachedNetworkImage(
                  key: ValueKey(_i),
                  imageUrl: pexelsUrl(widget.docs[_i].poster, w: 1280),
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(color: AppColors.dark),
                ),
              ),
      );
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
  void initState() {
    super.initState();
    Prefs.hasLiveNotify().then((v) { if (mounted) setState(() => _done = v); });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.glassStrong, borderRadius: BorderRadius.circular(14)),
        child: _done
            ? const Row(children: [
                Icon(Icons.check_circle, color: Colors.green),
                SizedBox(width: 8),
                Expanded(
                  child: Text("You're on the list — we'll notify you at launch!",
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ])
            : Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Get notified when we go live',
                    style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white)),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'you@email.com',
                        hintStyle: const TextStyle(color: AppColors.muted),
                        filled: true,
                        fillColor: AppColors.glass,
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(999), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: () async {
                      if (!_ctrl.text.contains('@')) return;
                      await Prefs.setLiveNotify(_ctrl.text);
                      if (mounted) setState(() => _done = true);
                    },
                    style: FilledButton.styleFrom(backgroundColor: AppColors.red),
                    child: const Text('Notify Me'),
                  ),
                ]),
              ]),
      ),
    );
  }
}
