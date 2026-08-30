import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../config/constants.dart';
import '../config/env.dart';
import '../config/theme.dart';
import '../models/ad_content.dart';
import '../models/feed_reel.dart';
import '../services/ads_service.dart';
import '../services/feed_service.dart';
import '../utils/formatters.dart';
import '../utils/video.dart';
import '../utils/share.dart';
import '../widgets/ad_strip.dart';

/// A full-screen ad slot goes in after every Nth reel. Mirrors the web SPA's
/// AD_EVERY_N_REELS so the two feeds have the same shape.
const int kAdEveryNReels = 3;

/// Fixed time an ad slot holds the screen before the feed moves on. It is
/// deliberately independent of the creative — a sponsor cannot buy extra screen
/// time by supplying a longer asset, and an ad still image has no natural end
/// to wait for the way a video does.
const Duration kAdDwell = Duration(seconds: 10);

/// Step for the on-screen rewind / forward buttons.
const int kSkipSeconds = 10;

/// One slot in the vertical feed: either a reel (optionally carrying a strip
/// ad) or a full-screen sponsored banner.
class _Item {
  final FeedReel? reel;
  final AdContent? banner;
  final AdContent? stripAd;
  _Item.reel(this.reel, this.stripAd) : banner = null;
  _Item.banner(this.banner)
      : reel = null,
        stripAd = null;
}

/// Tab 2 — full-screen vertical reels, snap-scrolled, newest first.
class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<FeedReel> _reels = [];
  List<AdContent> _ads = [];
  String _query = '';
  int _active = 0;
  bool _muted = true;
  bool _loading = true;
  final _controller = PageController();

  /// Pending auto-advance for an ad slot. Cancelled whenever the page changes,
  /// so scrolling away never leaves a stray jump queued.
  Timer? _adTimer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final reelsFuture = FeedService.fetchAll();
    final adsFuture = AdsService.fetchAll();
    final reels = await reelsFuture;
    final ads = await adsFuture;
    if (!mounted) return;
    setState(() {
      _reels = reels;
      _ads = ads;
      _loading = false;
    });
  }

  @override
  void dispose() {
    _adTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  /// Move to the next slot. Used by both the ad dwell timer and a reel that has
  /// played to its end.
  void _advance(int from) {
    if (!_controller.hasClients) return;
    if (from != _active) return; // the viewer already moved on
    final count = _buildItems().length;
    if (from >= count - 1) return;
    _controller.animateToPage(from + 1,
        duration: const Duration(milliseconds: 320), curve: Curves.easeOut);
  }

  /// Ads advance on a fixed timer; reels advance when their video ends.
  void _onPageChanged(int i, List<_Item> items) {
    _adTimer?.cancel();
    setState(() => _active = i);
    if (i < items.length && items[i].banner != null) {
      _adTimer = Timer(kAdDwell, () => _advance(i));
    }
  }

  /// Interleaves ads into the reel list: a full-screen ad slot after every
  /// [kAdEveryNReels] reels, plus wherever an admin flagged one.
  ///
  /// `_adCursor` walks the ad list once per inserted slot, so consecutive
  /// breaks show different sponsors. Indexing by reel position (the old rule)
  /// repeated a sponsor whenever the gap divided evenly into the list length.
  /// The strip overlay is now only where an admin asked for one — it used to
  /// also fire every third reel, which is what made ads look pinned to the top.
  List<_Item> _buildItems() {
    final q = _query.trim().toLowerCase();
    final reels = q.isEmpty
        ? _reels
        : _reels
            .where((r) => r.title.toLowerCase().contains(q) || r.titleTa.toLowerCase().contains(q))
            .toList();

    final items = <_Item>[];
    var adCursor = 0;
    for (var i = 0; i < reels.length; i++) {
      final r = reels[i];
      final stripAd = r.stripAdHost && _ads.isNotEmpty ? _ads[i % _ads.length] : null;
      items.add(_Item.reel(r, stripAd));

      if (_ads.isNotEmpty && (r.bannerAfter || (i + 1) % kAdEveryNReels == 0)) {
        items.add(_Item.banner(_ads[adCursor % _ads.length]));
        adCursor++;
      }
    }
    return items;
  }

  void _onSearch(String v) {
    setState(() {
      _query = v;
      _active = 0;
    });
    if (_controller.hasClients) _controller.jumpToPage(0);
  }

  @override
  Widget build(BuildContext context) {
    final items = _buildItems();
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        if (_loading)
          const Center(child: CircularProgressIndicator(color: AppColors.red))
        else if (items.isEmpty)
          // An unconfigured build reaches here too: Db.client is null, every
          // service returns [], and "Nothing here yet" is indistinguishable
          // from the database genuinely being empty. That is exactly how a
          // build made without SUPABASE_ANON_KEY looked like a content
          // problem. Say which it is.
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                !Env.isConfigured
                    ? 'This build has no Supabase key, so nothing can load. '
                        'Rebuild with '
                        '--dart-define-from-file=dart_defines.json '
                        '(see dart_defines.example.json).'
                    : _query.isEmpty
                        ? 'Nothing here yet'
                        : 'No matches',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.muted),
              ),
            ),
          )
        else
          PageView.builder(
            controller: _controller,
            scrollDirection: Axis.vertical,
            onPageChanged: (i) => _onPageChanged(i, items),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final it = items[i];
              if (it.banner != null) return _BannerSlide(ad: it.banner!);
              return _ReelView(
                // Keying by reel id makes Flutter rebuild state cleanly when the
                // search filter reshuffles which reel sits at a given index.
                key: ValueKey('${it.reel!.id}-$i'),
                reel: it.reel!,
                stripAd: it.stripAd,
                active: i == _active,
                muted: _muted,
                onToggleMute: () => setState(() => _muted = !_muted),
                onEnded: () => _advance(i),
              );
            },
          ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
            child: Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white24),
              ),
              child: Row(children: [
                const Icon(Icons.search, size: 16, color: Colors.white60),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    onChanged: _onSearch,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: const InputDecoration(
                      isDense: true,
                      border: InputBorder.none,
                      hintText: 'Search reels...',
                      hintStyle: TextStyle(color: Colors.white54),
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ),
      ]),
    );
  }
}

/// Full-screen sponsored banner slide.
class _BannerSlide extends StatelessWidget {
  final AdContent ad;
  const _BannerSlide({required this.ad});

  @override
  Widget build(BuildContext context) {
    return Stack(fit: StackFit.expand, children: [
      CachedNetworkImage(
        imageUrl: pexelsUrl(ad.bgImage, w: 1080),
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => Container(color: AppColors.dark),
      ),
      Container(color: Colors.black.withValues(alpha: 0.55)),
      Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(999)),
              child: const Text('SPONSORED',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black)),
            ),
            const SizedBox(height: 16),
            Text(ad.headline,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
            const SizedBox(height: 8),
            Text(ad.body,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.white70)),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)),
              child: Text(ad.cta, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
            ),
          ]),
        ),
      ),
    ]);
  }
}

class _ReelView extends StatefulWidget {
  final FeedReel reel;
  final AdContent? stripAd;
  final bool active;
  final bool muted;
  final VoidCallback onToggleMute;

  /// The video played to its end — the feed advances immediately.
  final VoidCallback onEnded;

  const _ReelView({
    super.key,
    required this.reel,
    required this.stripAd,
    required this.active,
    required this.muted,
    required this.onToggleMute,
    required this.onEnded,
  });

  @override
  State<_ReelView> createState() => _ReelViewState();
}

class _ReelViewState extends State<_ReelView> {
  VideoPlayerController? _vpc;
  bool _liked = false;

  /// Level for the rail's vertical volume control, 0..1. Mute is separate:
  /// muting sets the player to 0 without losing the level to come back to.
  double _volume = 1;
  bool _ended = false;

  /// Bumped on every attach/detach. An async `initialize()` that finishes after
  /// its generation has been superseded discards its controller instead of
  /// calling setState on a torn-down State.
  int _generation = 0;

  bool get _shouldPlay => widget.active && isNativePlayable(widget.reel.videoUrl);

  @override
  void initState() {
    super.initState();
    if (_shouldPlay) _attach();
  }

  @override
  void didUpdateWidget(covariant _ReelView old) {
    super.didUpdateWidget(old);
    if (_shouldPlay && _vpc == null) {
      _attach();
    } else if (!_shouldPlay && _vpc != null) {
      _detach();
    } else {
      _vpc?.setVolume(widget.muted ? 0 : _volume);
    }
  }

  /// VideoPlayerController has no completion callback, so completion is read
  /// off its value. Guarded by [_ended] because the listener keeps firing after
  /// the position settles, and a repeated advance would skip past an item.
  void _watchForEnd() {
    final v = _vpc?.value;
    if (v == null || !v.isInitialized || _ended) return;
    if (v.position >= v.duration && v.duration > Duration.zero) {
      _ended = true;
      widget.onEnded();
    }
  }

  void _setVolume(double next) {
    final clamped = next.clamp(0.0, 1.0);
    setState(() => _volume = clamped);
    _vpc?.setVolume(clamped);
    // Dragging the level off zero is an unmute request.
    if (clamped > 0 && widget.muted) widget.onToggleMute();
  }

  void _togglePlay() {
    final v = _vpc;
    if (v == null || !v.value.isInitialized) return;
    if (v.value.isPlaying) {
      v.pause();
    } else {
      // Replaying the last reel in the feed: it has nowhere to advance to, so
      // it sits at its end. Rewind before resuming or play() is a no-op.
      if (v.value.position >= v.value.duration) v.seekTo(Duration.zero);
      _ended = false;
      v.play();
    }
    setState(() {});
  }

  void _skip(int seconds) {
    final v = _vpc;
    if (v == null || !v.value.isInitialized) return;
    var target = v.value.position + Duration(seconds: seconds);
    if (target < Duration.zero) target = Duration.zero;
    if (target > v.value.duration) target = v.value.duration;
    _ended = false;
    v.seekTo(target);
  }

  Future<void> _attach() async {
    final gen = ++_generation;
    final vpc = VideoPlayerController.networkUrl(
      Uri.parse(widget.reel.videoUrl!),
      httpHeaders: videoHttpHeaders(widget.reel.videoUrl),
    );
    try {
      await vpc.initialize();
    } catch (_) {
      await vpc.dispose();
      return;
    }
    // Superseded (scrolled away, or widget disposed) while initializing.
    if (!mounted || gen != _generation) {
      await vpc.dispose();
      return;
    }
    // Not looping any more: a reel that reaches its end hands the feed on to
    // the next item (see _watchForEnd), which is what a vertical feed does.
    vpc
      ..setLooping(false)
      ..setVolume(widget.muted ? 0 : _volume)
      ..play();
    vpc.addListener(_watchForEnd);
    setState(() => _vpc = vpc);
  }

  void _detach() {
    _generation++;
    final old = _vpc;
    _vpc = null;
    _ended = false;
    old?.removeListener(_watchForEnd);
    old?.dispose();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _generation++;
    _vpc?.removeListener(_watchForEnd);
    _vpc?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reel;
    final ready = _vpc != null && _vpc!.value.isInitialized;
    final playing = ready && _vpc!.value.isPlaying;
    return GestureDetector(
      // Tapping the frame plays/pauses. It used to toggle mute, which left the
      // player with no way to pause at all.
      onTap: ready ? _togglePlay : null,
      child: Stack(fit: StackFit.expand, children: [
        if (ready)
          FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _vpc!.value.size.width,
              height: _vpc!.value.size.height,
              child: VideoPlayer(_vpc!),
            ),
          )
        else
          CachedNetworkImage(
            imageUrl: pexelsUrl(r.thumb, w: 1080),
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => Container(color: AppColors.dark),
          ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.black54, Colors.transparent, Colors.black87],
            ),
          ),
        ),
        if (widget.stripAd != null)
          Positioned(top: 62, left: 12, right: 12, child: AdStrip(ad: widget.stripAd!)),
        Positioned(right: 12, bottom: 132, child: Column(children: [
          // Views. Read-only, so no onTap — it matches the stack visually
          // without pretending to be a button.
          _action(Icons.visibility_outlined, formatCount(r.displayViewCount), null),
          _action(_liked ? Icons.favorite : Icons.favorite_border,
              formatCount(r.likes + (_liked ? 1 : 0)),
              () => setState(() => _liked = !_liked),
              color: _liked ? AppColors.red : Colors.white),
          // Shares the seo-site URL, which server-renders per-reel OpenGraph
          // tags so the link previews properly. See utils/share.dart.
          _action(Icons.share_outlined, formatCount(r.shares),
              () => shareContent(kind: ShareKind.reel, id: r.id, slug: r.slug, title: r.title)),
          // The only volume control in the player: speaker toggles mute, the
          // short vertical track under it sets the level. A horizontal slider
          // would not fit this 46px column, which is why it is drawn this way.
          _action(widget.muted ? Icons.volume_off : Icons.volume_up, '', widget.onToggleMute),
          if (ready)
            _VolumeLevel(
              value: widget.muted ? 0 : _volume,
              onChanged: _setVolume,
            ),
        ])),

        // Rewind / play-pause / forward, on the video itself.
        if (ready)
          Positioned.fill(
            child: Center(
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                _round(Icons.replay_10, 46, () => _skip(-kSkipSeconds)),
                const SizedBox(width: 26),
                _round(playing ? Icons.pause : Icons.play_arrow, 62, _togglePlay),
                const SizedBox(width: 26),
                _round(Icons.forward_10, 46, () => _skip(kSkipSeconds)),
              ]),
            ),
          ),

        // Scrub bar. Sits inside the Scaffold body, which already ends above
        // the bottom nav (main_shell puts the feed in an Expanded and the nav in
        // the Scaffold's own bottomNavigationBar slot), so it cannot be covered.
        if (ready)
          Positioned(
            left: 12,
            right: 12,
            bottom: 14,
            child: VideoProgressIndicator(
              _vpc!,
              allowScrubbing: true,
              padding: const EdgeInsets.symmetric(vertical: 10),
              colors: const VideoProgressColors(
                playedColor: AppColors.red,
                bufferedColor: Colors.white24,
                backgroundColor: Colors.white12,
              ),
            ),
          ),
        Positioned(
          left: 16,
          right: 88,
          bottom: 54,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: genreColor(r.genre), borderRadius: BorderRadius.circular(4)),
                child: Text(r.contentType.toUpperCase(),
                    style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white)),
              ),
              const SizedBox(width: 8),
              Text(r.duration, style: const TextStyle(fontSize: 10, color: Colors.white70)),
            ]),
            const SizedBox(height: 6),
            if (r.creator.isNotEmpty)
              Text(r.creator,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.gold)),
            // Tamil title primary (bold, larger); English secondary beneath.
            Text(r.titleTa.isNotEmpty ? r.titleTa : r.title,
                style: tamilStyle(size: 17, color: Colors.white, weight: FontWeight.bold)),
            if (r.titleTa.isNotEmpty)
              Text(r.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: Colors.white70)),
            if (r.caption.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(r.caption,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11, color: Colors.white60)),
              ),
          ]),
        ),
      ]),
    );
  }

  Widget _round(IconData icon, double size, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.35), shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white, size: size * 0.45),
        ),
      );

  Widget _action(IconData icon, String label, VoidCallback? onTap, {Color color = Colors.white}) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Column(children: [
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 21),
            ),
          ),
          if (label.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(label,
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
        ]),
      );
}

/// Compact vertical volume level for the action rail.
///
/// Deliberately not a Slider: the rail column is 46px wide and a Material
/// slider needs far more room, which is how the web player ended up with a
/// second volume control somewhere else entirely. Drag anywhere on the track —
/// the whole 56px height is the hit area, top is full, bottom is silent.
class _VolumeLevel extends StatelessWidget {
  final double value;
  final ValueChanged<double> onChanged;
  const _VolumeLevel({required this.value, required this.onChanged});

  void _fromLocal(Offset local, double height) =>
      onChanged((1 - local.dy / height).clamp(0.0, 1.0));

  @override
  Widget build(BuildContext context) {
    const height = 56.0;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: SizedBox(
        width: 24,
        height: height,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTapDown: (d) => _fromLocal(d.localPosition, height),
          onVerticalDragUpdate: (d) => _fromLocal(d.localPosition, height),
          child: Center(
            child: Container(
              width: 6,
              height: height,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(3),
              ),
              child: Align(
                alignment: Alignment.bottomCenter,
                child: FractionallySizedBox(
                  heightFactor: value.clamp(0.0, 1.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
