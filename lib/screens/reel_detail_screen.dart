import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/feed_reel.dart';
import '../utils/formatters.dart';
import '../utils/video.dart';

/// Detail view for a single feed reel, reached from Search.
///
/// Reels are shot 9:16, so this player is locked to portrait — it never
/// requests a landscape orientation the way the 16:9 documentary player does.
class ReelDetailScreen extends StatefulWidget {
  final FeedReel reel;
  const ReelDetailScreen({super.key, required this.reel});

  @override
  State<ReelDetailScreen> createState() => _ReelDetailScreenState();
}

class _ReelDetailScreenState extends State<ReelDetailScreen> {
  VideoPlayerController? _vpc;
  bool _muted = false;
  bool _liked = false;

  /// YouTube serves a web page rather than a media stream, so only direct
  /// mp4/HLS sources reach the native player. See utils/video.dart.
  bool get _playable => isNativePlayable(widget.reel.videoUrl);

  @override
  void initState() {
    super.initState();
    if (_playable) _init();
  }

  Future<void> _init() async {
    final vpc = VideoPlayerController.networkUrl(
      Uri.parse(widget.reel.videoUrl!),
      httpHeaders: videoHttpHeaders(widget.reel.videoUrl),
    );
    _vpc = vpc;
    try {
      await vpc.initialize();
    } catch (_) {
      if (mounted) setState(() => _vpc = null);
      return;
    }
    if (!mounted) { vpc.dispose(); return; }
    vpc
      ..setLooping(true)
      ..setVolume(_muted ? 0 : 1)
      ..play();
    setState(() {});
  }

  @override
  void dispose() {
    _vpc?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    final v = _vpc;
    if (v == null || !v.value.isInitialized) return;
    setState(() => v.value.isPlaying ? v.pause() : v.play());
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.reel;
    final playing = _vpc?.value.isPlaying ?? false;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(fit: StackFit.expand, children: [
        GestureDetector(
          onTap: _togglePlay,
          child: (_vpc != null && _vpc!.value.isInitialized)
              ? FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width: _vpc!.value.size.width,
                    height: _vpc!.value.size.height,
                    child: VideoPlayer(_vpc!),
                  ),
                )
              : CachedNetworkImage(
                  imageUrl: pexelsUrl(r.thumb, w: 1080),
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(color: AppColors.dark),
                ),
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.black87, Colors.transparent, Colors.black87],
            ),
          ),
        ),
        if (!playing)
          Center(
            child: GestureDetector(
              onTap: _togglePlay,
              child: Container(
                width: 66,
                height: 66,
                decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle),
                child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 38),
              ),
            ),
          ),
        SafeArea(
          child: Row(children: [
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
            ),
            const Spacer(),
            IconButton(
              onPressed: () {
                setState(() => _muted = !_muted);
                _vpc?.setVolume(_muted ? 0 : 1);
              },
              icon: Icon(_muted ? Icons.volume_off : Icons.volume_up, color: Colors.white),
            ),
          ]),
        ),
        Positioned(right: 12, bottom: 120, child: Column(children: [
          _action(_liked ? Icons.favorite : Icons.favorite_border,
              formatCount(r.likes + (_liked ? 1 : 0)),
              () => setState(() => _liked = !_liked),
              color: _liked ? AppColors.red : Colors.white),
          _action(Icons.chat_bubble_outline, formatCount(r.comments), () {}),
          _action(Icons.share_outlined, formatCount(r.shares), () {}),
        ])),
        Positioned(
          left: 16,
          right: 88,
          bottom: 40,
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
              Text(r.creator, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.gold)),
            Text(r.titleTa.isNotEmpty ? r.titleTa : r.title,
                style: tamilStyle(size: 18, color: Colors.white, weight: FontWeight.bold)),
            if (r.titleTa.isNotEmpty)
              Text(r.title, style: const TextStyle(fontSize: 12, color: Colors.white70)),
            if (r.caption.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(r.caption,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: Colors.white70, height: 1.35)),
              ),
          ]),
        ),
      ]),
    );
  }

  Widget _action(IconData icon, String label, VoidCallback onTap, {Color color = Colors.white}) => Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: Column(children: [
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 22),
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
