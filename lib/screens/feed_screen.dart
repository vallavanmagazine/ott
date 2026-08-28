import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/ad_content.dart';
import '../models/feed_reel.dart';
import '../services/ads_service.dart';
import '../services/feed_service.dart';
import '../utils/formatters.dart';
import '../widgets/ad_strip.dart';

/// True when the URL points at something the native player can decode.
/// YouTube links need an embedded webview, so they fall back to the thumbnail.
bool _nativePlayable(String? url) {
  if (url == null || url.isEmpty) return false;
  return !url.contains('youtube') && !url.contains('youtu.be');
}

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
    _controller.dispose();
    super.dispose();
  }

  /// Interleaves ads into the reel list: a strip ad overlays every 3rd reel,
  /// and a full-screen banner is inserted after every 5th.
  List<_Item> _buildItems() {
    final q = _query.trim().toLowerCase();
    final reels = q.isEmpty
        ? _reels
        : _reels
            .where((r) => r.title.toLowerCase().contains(q) || r.titleTa.toLowerCase().contains(q))
            .toList();

    final items = <_Item>[];
    for (var i = 0; i < reels.length; i++) {
      final r = reels[i];
      final hasStrip = r.stripAdHost || (i > 0 && (i + 1) % 3 == 0);
      final stripAd = hasStrip && _ads.isNotEmpty ? _ads[i % _ads.length] : null;
      items.add(_Item.reel(r, stripAd));

      final wantsBanner = r.bannerAfter || (i > 0 && (i + 1) % 5 == 0);
      if (wantsBanner && _ads.isNotEmpty) {
        items.add(_Item.banner(_ads[(i + 2) % _ads.length]));
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
          Center(
            child: Text(_query.isEmpty ? 'Nothing here yet' : 'No matches',
                style: const TextStyle(color: AppColors.muted)),
          )
        else
          PageView.builder(
            controller: _controller,
            scrollDirection: Axis.vertical,
            onPageChanged: (i) => setState(() => _active = i),
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
  const _ReelView({
    super.key,
    required this.reel,
    required this.stripAd,
    required this.active,
    required this.muted,
    required this.onToggleMute,
  });

  @override
  State<_ReelView> createState() => _ReelViewState();
}

class _ReelViewState extends State<_ReelView> {
  VideoPlayerController? _vpc;
  bool _liked = false;

  /// Bumped on every attach/detach. An async `initialize()` that finishes after
  /// its generation has been superseded discards its controller instead of
  /// calling setState on a torn-down State.
  int _generation = 0;

  bool get _shouldPlay => widget.active && _nativePlayable(widget.reel.videoUrl);

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
      _vpc?.setVolume(widget.muted ? 0 : 1);
    }
  }

  Future<void> _attach() async {
    final gen = ++_generation;
    final vpc = VideoPlayerController.networkUrl(Uri.parse(widget.reel.videoUrl!));
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
    vpc
      ..setLooping(true)
      ..setVolume(widget.muted ? 0 : 1)
      ..play();
    setState(() => _vpc = vpc);
  }

  void _detach() {
    _generation++;
    final old = _vpc;
    _vpc = null;
    old?.dispose();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _generation++;
    _vpc?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reel;
    final ready = _vpc != null && _vpc!.value.isInitialized;
    return GestureDetector(
      onTap: widget.onToggleMute,
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
        Positioned(right: 12, bottom: 110, child: Column(children: [
          _action(_liked ? Icons.favorite : Icons.favorite_border,
              formatCount(r.likes + (_liked ? 1 : 0)),
              () => setState(() => _liked = !_liked),
              color: _liked ? AppColors.red : Colors.white),
          _action(Icons.chat_bubble_outline, formatCount(r.comments), () {}),
          _action(Icons.share_outlined, formatCount(r.shares), () {}),
          _action(widget.muted ? Icons.volume_off : Icons.volume_up, '', widget.onToggleMute),
        ])),
        Positioned(
          left: 16,
          right: 88,
          bottom: 32,
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

  Widget _action(IconData icon, String label, VoidCallback onTap, {Color color = Colors.white}) => Padding(
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
