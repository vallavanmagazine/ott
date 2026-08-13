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
import '../widgets/category_chips.dart';

String _kindOf(String? url) {
  if (url == null || url.isEmpty) return 'none';
  if (url.contains('youtube') || url.contains('youtu.be')) return 'youtube';
  if (url.contains('.m3u8')) return 'hls';
  return 'mp4';
}

class _Item {
  final FeedReel? reel;
  final AdContent? banner;
  final AdContent? stripAd;
  _Item.reel(this.reel, this.stripAd) : banner = null;
  _Item.banner(this.banner) : reel = null, stripAd = null;
}

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  List<FeedReel> _reels = [];
  List<AdContent> _ads = [];
  String _category = 'All';
  int _active = 0;
  bool _muted = true;
  final _controller = PageController();

  @override
  void initState() {
    super.initState();
    Future.wait([FeedService.fetchAll(), AdsService.fetchAll()]).then((r) {
      if (!mounted) return;
      setState(() { _reels = r[0] as List<FeedReel>; _ads = r[1] as List<AdContent>; });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<_Item> _build() {
    final reels = _category == 'All' ? _reels : _reels.where((r) => r.contentType == _category).toList();
    final items = <_Item>[];
    for (var i = 0; i < reels.length; i++) {
      final r = reels[i];
      final hasStrip = r.stripAdHost || (i > 0 && (i + 1) % 3 == 0);
      final stripAd = hasStrip && _ads.isNotEmpty ? _ads[i % _ads.length] : null;
      items.add(_Item.reel(r, stripAd));
      if ((r.bannerAfter || ((i + 1) % 5 == 0 && i > 0)) && _ads.isNotEmpty) {
        items.add(_Item.banner(_ads[(i + 2) % _ads.length]));
      }
    }
    return items;
  }

  @override
  Widget build(BuildContext context) {
    final items = _build();
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        if (items.isEmpty)
          const Center(child: Text('Nothing in this category yet', style: TextStyle(color: AppColors.muted)))
        else
          PageView.builder(
            controller: _controller,
            scrollDirection: Axis.vertical,
            onPageChanged: (i) => setState(() => _active = i),
            itemCount: items.length,
            itemBuilder: (_, i) {
              final it = items[i];
              if (it.banner != null) return _bannerReel(it.banner!);
              return _ReelView(reel: it.reel!, stripAd: it.stripAd, active: i == _active, muted: _muted, onToggleMute: () => setState(() => _muted = !_muted));
            },
          ),
        // Top: title + category chips
        Positioned(top: 0, left: 0, right: 0, child: SafeArea(child: Column(children: [
          const Padding(padding: EdgeInsets.fromLTRB(16, 8, 16, 8), child: Align(alignment: Alignment.centerLeft, child: Text('Feed', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)))),
          FilterChipsBar(options: K.feedCategories, active: _category, onSelected: (c) { setState(() { _category = c; _active = 0; }); if (_controller.hasClients) _controller.jumpToPage(0); }),
        ]))),
      ]),
    );
  }

  Widget _bannerReel(AdContent ad) {
    return Stack(fit: StackFit.expand, children: [
      CachedNetworkImage(imageUrl: pexelsUrl(ad.bgImage, w: 1080), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
      Container(color: Colors.black.withValues(alpha: 0.5)),
      Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(999)), child: const Text('SPONSORED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.black))),
        const SizedBox(height: 16),
        Text(ad.headline, textAlign: TextAlign.center, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
        const SizedBox(height: 8),
        Text(ad.body, textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.white70)),
        const SizedBox(height: 20),
        Container(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)), child: Text(ad.cta, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black))),
      ]))),
    ]);
  }
}

class _ReelView extends StatefulWidget {
  final FeedReel reel;
  final AdContent? stripAd;
  final bool active;
  final bool muted;
  final VoidCallback onToggleMute;
  const _ReelView({required this.reel, required this.stripAd, required this.active, required this.muted, required this.onToggleMute});

  @override
  State<_ReelView> createState() => _ReelViewState();
}

class _ReelViewState extends State<_ReelView> {
  VideoPlayerController? _vpc;
  bool _liked = false;

  bool get _playable => widget.active && (_kindOf(widget.reel.videoUrl) == 'mp4' || _kindOf(widget.reel.videoUrl) == 'hls');

  @override
  void didUpdateWidget(covariant _ReelView old) {
    super.didUpdateWidget(old);
    if (_playable && _vpc == null) _initVideo();
    if (!widget.active && _vpc != null) { _vpc?.dispose(); _vpc = null; setState(() {}); }
    if (_vpc != null) _vpc!.setVolume(widget.muted ? 0 : 1);
  }

  @override
  void initState() {
    super.initState();
    if (_playable) _initVideo();
  }

  Future<void> _initVideo() async {
    final vpc = VideoPlayerController.networkUrl(Uri.parse(widget.reel.videoUrl!));
    _vpc = vpc;
    await vpc.initialize();
    if (!mounted) return;
    vpc..setLooping(true)..setVolume(widget.muted ? 0 : 1)..play();
    setState(() {});
  }

  @override
  void dispose() {
    _vpc?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reel;
    return GestureDetector(
      onTap: widget.onToggleMute,
      child: Stack(fit: StackFit.expand, children: [
        if (_vpc != null && _vpc!.value.isInitialized)
          FittedBox(fit: BoxFit.cover, child: SizedBox(width: _vpc!.value.size.width, height: _vpc!.value.size.height, child: VideoPlayer(_vpc!)))
        else
          CachedNetworkImage(imageUrl: pexelsUrl(r.thumb, w: 1080), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
        const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black54, Colors.transparent, Colors.black87]))),
        // Strip ad
        if (widget.stripAd != null) Positioned(top: 96, left: 12, right: 12, child: AdStrip(ad: widget.stripAd!)),
        // Right actions
        Positioned(right: 12, bottom: 120, child: Column(children: [
          _action(_liked ? Icons.favorite : Icons.favorite_border, formatCount(r.likes + (_liked ? 1 : 0)), () => setState(() => _liked = !_liked), color: _liked ? AppColors.red : Colors.white),
          _action(Icons.chat_bubble_outline, formatCount(r.comments), () {}),
          _action(Icons.share_outlined, formatCount(r.shares), () {}),
          _action(widget.muted ? Icons.volume_off : Icons.volume_up, '', widget.onToggleMute),
        ])),
        // Bottom info
        Positioned(left: 16, right: 90, bottom: 90, child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Row(children: [
            Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: genreColor(r.genre), borderRadius: BorderRadius.circular(4)), child: Text(r.contentType.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white))),
            const SizedBox(width: 8),
            Text(r.duration, style: const TextStyle(fontSize: 10, color: Colors.white70)),
          ]),
          const SizedBox(height: 6),
          Text(r.creator, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.gold)),
          Text(r.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          Text(r.caption, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, color: Colors.white70)),
        ])),
      ]),
    );
  }

  Widget _action(IconData icon, String label, VoidCallback onTap, {Color color = Colors.white}) => Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: Column(children: [
          GestureDetector(onTap: onTap, child: Container(width: 48, height: 48, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), shape: BoxShape.circle), child: Icon(icon, color: color, size: 22))),
          if (label.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 4), child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white))),
        ]),
      );
}
