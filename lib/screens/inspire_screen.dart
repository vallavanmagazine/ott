import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../models/inspire_item.dart';
import '../services/inspire_service.dart';
import '../services/categories_service.dart';
import '../widgets/category_chips.dart';
import '../widgets/vallavan_header.dart';
import 'video_player_screen.dart';

class InspireScreen extends StatefulWidget {
  const InspireScreen({super.key});
  @override
  State<InspireScreen> createState() => _InspireScreenState();
}

class _InspireScreenState extends State<InspireScreen> {
  List<InspireItem> _items = [];
  List<String> _cats = K.inspireCategories;
  bool _loading = true;
  String _cat = 'All';

  @override
  void initState() {
    super.initState();
    _load();
    // K.inspireCategories already starts with 'All'; DB names get 'All' prefixed.
    CategoriesService.fetchNames('inspire').then((names) {
      if (mounted && names.isNotEmpty) setState(() => _cats = ['All', ...names]);
    });
  }

  Future<void> _load() async {
    final v = await InspireService.fetchAll();
    if (mounted) setState(() { _items = v; _loading = false; });
  }

  Documentary _toDoc(InspireItem i) => Documentary(
        id: i.id, title: i.title, titleTa: i.titleTa, genre: i.category, durationSec: i.durationSec,
        poster: i.poster, backdrop: i.poster, year: 2024, language: 'Tamil',
        synopsis: i.quote ?? 'Short-form inspirational content.', synopsisTa: '', director: i.attribution, videoUrl: i.videoUrl,
      );

  void _open(InspireItem i) => Navigator.push(context, MaterialPageRoute(builder: (_) => VideoPlayerScreen(item: _toDoc(i))));

  @override
  Widget build(BuildContext context) {
    final filtered = _cat == 'All' ? _items : _items.where((i) => i.category == _cat).toList();
    final featured = _items.isNotEmpty ? _items.first : null;

    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        bottom: false,
        child: Column(children: [
          const VallavanHeader(notificationCount: 3),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.red))
                : RefreshIndicator(
                    color: AppColors.red,
                    backgroundColor: AppColors.dark,
                    onRefresh: _load,
                    child: ListView(padding: EdgeInsets.zero, children: [
                      if (featured != null) _hero(featured),
                      FilterChipsBar(options: _cats, active: _cat, onSelected: (c) => setState(() => _cat = c)),
                      const SizedBox(height: 8),
                      if (filtered.isEmpty)
                        const Padding(padding: EdgeInsets.all(40), child: Center(child: Text('Nothing here yet', style: TextStyle(color: AppColors.muted))))
                      else
                        ...filtered.map((i) => Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 12), child: _card(i))),
                      const SizedBox(height: 16),
                    ]),
                  ),
          ),
        ]),
      ),
    );
  }

  Widget _hero(InspireItem i) => GestureDetector(
        onTap: () => _open(i),
        child: Container(
          margin: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          height: 210,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(18)),
          child: Stack(fit: StackFit.expand, children: [
            CachedNetworkImage(imageUrl: pexelsUrl(i.poster, w: 900), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
            const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black26, Colors.black87]))),
            Positioned(left: 16, right: 16, bottom: 16, child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              if (i.isSponsored) _sponsoredBadge(),
              if (i.quote != null) Text('"${i.quote}"', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 16, fontStyle: FontStyle.italic, fontWeight: FontWeight.w700, color: Colors.white)),
              if (i.attribution != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('— ${i.attribution}', style: const TextStyle(fontSize: 12, color: AppColors.gold, fontWeight: FontWeight.bold))),
            ])),
            const Positioned(right: 16, top: 16, child: Icon(Icons.play_circle_fill, color: Colors.white, size: 40)),
          ]),
        ),
      );

  Widget _card(InspireItem i) => GestureDetector(
        onTap: () => _open(i),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(children: [
            AspectRatio(
              aspectRatio: 16 / 10,
              child: CachedNetworkImage(imageUrl: pexelsUrl(i.poster, w: 800), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
            ),
            const Positioned.fill(child: DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black, Colors.black])))),
            Positioned(left: 14, right: 14, top: 12, child: Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: genreColor(i.category), borderRadius: BorderRadius.circular(4)),
                child: Text(i.category.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white)),
              ),
              const Spacer(),
              if (i.isSponsored) _sponsoredBadge(),
            ])),
            Positioned(left: 14, right: 14, bottom: 12, child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              if (i.quote != null) Text('"${i.quote}"', maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontStyle: FontStyle.italic, fontWeight: FontWeight.w600, color: Colors.white, height: 1.3)),
              const SizedBox(height: 6),
              Row(children: [
                if (i.attribution != null) Expanded(child: Text('— ${i.attribution}', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppColors.gold, fontWeight: FontWeight.bold))),
                Text('${i.category} • ${i.duration}', style: const TextStyle(fontSize: 10, color: Colors.white70)),
              ]),
            ])),
          ]),
        ),
      );

  Widget _sponsoredBadge() => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(color: AppColors.gold, borderRadius: BorderRadius.circular(4)),
        child: const Text('SPONSORED', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 0.5, color: Colors.black)),
      );
}
