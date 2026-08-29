import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:chewie/chewie.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../services/ad_engine.dart';
import '../services/documentaries_service.dart';
import '../utils/geo_detect.dart';
import '../utils/library.dart';
import '../utils/video.dart';
import '../widgets/ad_overlay.dart';
import '../widgets/content_card.dart';

class VideoPlayerScreen extends StatefulWidget {
  final Documentary item;
  const VideoPlayerScreen({super.key, required this.item});
  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  VideoPlayerController? _vpc;
  ChewieController? _chewie;
  late final VideoKind _kind;

  String _district = 'Chennai';
  List<Documentary> _related = [];

  ServedAd _preroll = AdEngine.houseAd();
  ServedAd _midroll = AdEngine.houseAd();
  ServedAd _postroll = AdEngine.houseAd();
  ServedAd _strip = AdEngine.houseAd();

  bool _showPre = false;
  int _preCountdown = 5;
  bool _showMid = false;
  bool _midShown = false;
  bool _ended = false;
  bool _stripVisible = false;
  Timer? _preTimer, _stripShow, _stripHide;

  @override
  void initState() {
    super.initState();
    _kind = classifyVideoUrl(widget.item.videoUrl);
    _showPre = _kind != VideoKind.none;
    if (widget.item.id != 'live-player') Library.addToHistory(widget.item);
    DocumentariesService.related(widget.item.genre, widget.item.id).then((r) { if (mounted) setState(() => _related = r); });
    _initAds();
    if (isNativePlayable(widget.item.videoUrl)) _initVideo();
  }

  Future<void> _initAds() async {
    final d = await GeoDetect.detectDistrict();
    final pre = await AdEngine.getVideoAd(d);
    final mid = await AdEngine.getVideoAd(d, exclude: [pre.ad.id]);
    final post = await AdEngine.getOverlayAd(d, exclude: [pre.ad.id]);
    final strip = await AdEngine.getOverlayAd(d);
    if (!mounted) return;
    setState(() { _district = d; _preroll = pre; _midroll = mid; _postroll = post; _strip = strip; });
    if (_showPre) { AdEngine.trackImpression(pre.ad.id, pre.campaignId, d, 'preroll'); _startPreCountdown(); }
  }

  void _startPreCountdown() {
    _preCountdown = 5;
    _preTimer?.cancel();
    _preTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      if (_preCountdown <= 1) { t.cancel(); _endPreroll(); } else { setState(() => _preCountdown--); }
    });
  }

  void _endPreroll() {
    setState(() => _showPre = false);
    _chewie?.play();
    _scheduleStrip(const Duration(seconds: 30));
  }

  Future<void> _initVideo() async {
    final vpc = VideoPlayerController.networkUrl(Uri.parse(widget.item.videoUrl!));
    _vpc = vpc;
    await vpc.initialize();
    vpc.addListener(_onTick);
    if (!mounted) return;
    setState(() {
      _chewie = ChewieController(
        videoPlayerController: vpc,
        aspectRatio: 16 / 9,
        autoPlay: false,
        looping: false,
        allowFullScreen: true,
        materialProgressColors: ChewieProgressColors(playedColor: AppColors.red, handleColor: AppColors.red, bufferedColor: Colors.white24, backgroundColor: Colors.white10),
        deviceOrientationsOnEnterFullScreen: const [DeviceOrientation.landscapeLeft, DeviceOrientation.landscapeRight],
        deviceOrientationsAfterFullScreen: const [DeviceOrientation.portraitUp],
      );
    });
  }

  void _onTick() {
    final v = _vpc;
    if (v == null || !v.value.isInitialized) return;
    final dur = v.value.duration.inSeconds;
    final pos = v.value.position.inSeconds;
    if (!_midShown && dur > K.midrollMinSec && pos / dur >= 0.5) {
      _midShown = true;
      v.pause();
      AdEngine.trackImpression(_midroll.ad.id, _midroll.campaignId, _district, 'midroll');
      setState(() => _showMid = true);
    }
    if (dur > 0 && pos >= dur - 1 && !_ended) {
      _ended = true;
      AdEngine.trackImpression(_postroll.ad.id, _postroll.campaignId, _district, 'postroll');
      setState(() {});
    }
  }

  void _scheduleStrip(Duration delay) {
    _stripShow?.cancel();
    _stripShow = Timer(delay, () {
      if (!mounted || _showPre || _showMid || _ended) return;
      AdEngine.trackImpression(_strip.ad.id, _strip.campaignId, _district, 'strip');
      setState(() => _stripVisible = true);
      _stripHide = Timer(const Duration(seconds: 8), () { if (mounted) setState(() => _stripVisible = false); _scheduleStrip(const Duration(seconds: 90)); });
    });
  }

  void _dismissStrip() { setState(() => _stripVisible = false); _stripHide?.cancel(); _scheduleStrip(const Duration(seconds: 120)); }

  @override
  void dispose() {
    _preTimer?.cancel();
    _stripShow?.cancel();
    _stripHide?.cancel();
    _vpc?.removeListener(_onTick);
    _chewie?.dispose();
    _vpc?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        backgroundColor: AppColors.black,
        title: Text(item.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        leading: IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => Navigator.pop(context)),
        actions: const [Icon(Icons.cast, size: 20), SizedBox(width: 12)],
      ),
      body: ListView(children: [
        // 16:9 stage
        AspectRatio(
          aspectRatio: 16 / 9,
          child: Container(
            color: Colors.black,
            child: Stack(fit: StackFit.expand, children: [
              _videoSurface(),
              if (_showPre) AdOverlay(served: _preroll, isMidRoll: false, countdown: _preCountdown, onSkip: _endPreroll, onCta: () => AdEngine.trackClick(_preroll.ad.id, _preroll.campaignId, _district, 'preroll')),
              if (_showMid) AdOverlay(served: _midroll, isMidRoll: true, countdown: 0, onSkip: () { setState(() => _showMid = false); _vpc?.play(); }, onCta: () => AdEngine.trackClick(_midroll.ad.id, _midroll.campaignId, _district, 'midroll')),
              if (_ended) _postRollCard(),
              if (_stripVisible && !_showPre && !_showMid && !_ended) Positioned(left: 8, right: 8, bottom: 8, child: _stripBanner()),
            ]),
          ),
        ),
        // Metadata
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(item.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
            Text(item.titleTa, style: tamilStyle(size: 14, color: AppColors.gold)),
            const SizedBox(height: 8),
            Row(children: [
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: genreColor(item.genre), borderRadius: BorderRadius.circular(4)), child: Text(item.genre.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white))),
              const SizedBox(width: 8),
              Text('${item.year} · ${item.duration} · ${item.language}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
            ]),
            if (item.synopsis.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 12), child: Text(item.synopsis, style: const TextStyle(fontSize: 14, height: 1.5, color: Colors.white70))),
            if (item.director != null) Padding(padding: const EdgeInsets.only(top: 10), child: Text('Director: ${item.director}', style: const TextStyle(fontSize: 12, color: AppColors.muted))),
            if (item.cast.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 2), child: Text('Cast: ${item.cast.join(', ')}', style: const TextStyle(fontSize: 12, color: AppColors.muted))),
          ]),
        ),
        if (_related.isNotEmpty) ...[
          const Padding(padding: EdgeInsets.fromLTRB(16, 20, 16, 10), child: Text('Related Videos', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white))),
          SizedBox(height: 160, child: ListView.separated(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), itemCount: _related.length, separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => ContentCard(item: _related[i], width: 220, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => VideoPlayerScreen(item: _related[i])))))),
        ],
        const SizedBox(height: 24),
      ]),
    );
  }

  Widget _videoSurface() {
    if (_showPre || _showMid) return const SizedBox.shrink();
    if (_chewie != null && isNativePlayable(widget.item.videoUrl)) return Chewie(controller: _chewie!);
    // YouTube / none → poster + action
    return Stack(fit: StackFit.expand, children: [
      CachedNetworkImage(imageUrl: pexelsUrl(widget.item.backdrop, w: 800), fit: BoxFit.cover, color: Colors.black38, colorBlendMode: BlendMode.darken, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
      Center(child: _kind == VideoKind.youtube
          ? FilledButton.icon(onPressed: () => launchUrl(Uri.parse(toWatchUrl(widget.item.videoUrl!)), mode: LaunchMode.externalApplication), icon: const Icon(Icons.play_arrow), label: const Text('Play on YouTube'), style: FilledButton.styleFrom(backgroundColor: AppColors.red))
          : const Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.play_circle_outline, size: 44, color: Colors.white70), SizedBox(height: 6), Text('Video coming soon', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))])),
    ]);
  }

  Widget _postRollCard() {
    final next = _related.isNotEmpty ? _related.first : null;
    return Container(
      color: Colors.black.withValues(alpha: 0.92),
      padding: const EdgeInsets.all(12),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)), child: const Text('SPONSORED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.black))),
        const SizedBox(height: 6),
        Text(_postroll.ad.sponsor, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gold)),
        Text(_postroll.ad.headline, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white)),
        const SizedBox(height: 6),
        GestureDetector(onTap: () => AdEngine.trackClick(_postroll.ad.id, _postroll.campaignId, _district, 'postroll'), child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)), child: Text(_postroll.ad.cta, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black)))),
        const SizedBox(height: 10),
        if (next != null) GestureDetector(onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => VideoPlayerScreen(item: next))),
          child: Row(mainAxisSize: MainAxisSize.min, children: [ClipRRect(borderRadius: BorderRadius.circular(6), child: CachedNetworkImage(imageUrl: pexelsUrl(next.poster, w: 200), width: 64, height: 40, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 64, height: 40, color: AppColors.dark))), const SizedBox(width: 8), Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [const Text('WATCH NEXT', style: TextStyle(fontSize: 8, color: AppColors.muted, fontWeight: FontWeight.bold)), Text(next.title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white))])])),
        const SizedBox(height: 8),
        TextButton(onPressed: () { _vpc?.seekTo(Duration.zero); _vpc?.play(); setState(() => _ended = false); }, child: const Text('Replay', style: TextStyle(color: AppColors.muted))),
      ]),
    );
  }

  Widget _stripBanner() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.gold.withValues(alpha: 0.3))),
      child: Row(children: [
        Container(padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2), decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(3)), child: const Text('AD', style: TextStyle(fontSize: 7, fontWeight: FontWeight.w900, color: Colors.black))),
        const SizedBox(width: 8),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [Text(_strip.ad.sponsor, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.gold)), Text(_strip.ad.headline, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white))])),
        GestureDetector(onTap: () => AdEngine.trackClick(_strip.ad.id, _strip.campaignId, _district, 'strip'), child: Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(999)), child: const Text('Learn More', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black)))),
        const SizedBox(width: 6),
        GestureDetector(onTap: _dismissStrip, child: const Icon(Icons.close, size: 16, color: Colors.white70)),
      ]),
    );
  }
}
