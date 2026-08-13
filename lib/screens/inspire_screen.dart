import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../models/inspire_item.dart';
import '../services/inspire_service.dart';
import '../widgets/category_chips.dart';
import 'video_player_screen.dart';

class InspireScreen extends StatefulWidget {
  const InspireScreen({super.key});
  @override
  State<InspireScreen> createState() => _InspireScreenState();
}

class _InspireScreenState extends State<InspireScreen> {
  List<InspireItem> _items = [];
  bool _loading = true;
  String _cat = 'All';

  @override
  void initState() {
    super.initState();
    InspireService.fetchAll().then((v) { if (mounted) setState(() { _items = v; _loading = false; }); });
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
    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: Column(children: [
          const Padding(padding: EdgeInsets.fromLTRB(16, 12, 16, 8), child: Align(alignment: Alignment.centerLeft, child: Text('Inspire', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)))),
          FilterChipsBar(options: K.inspireCategories, active: _cat, onSelected: (c) => setState(() => _cat = c)),
          const SizedBox(height: 12),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.red))
                : filtered.isEmpty
                    ? const Center(child: Text('Nothing here yet', style: TextStyle(color: AppColors.muted)))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (_, i) => _card(filtered[i]),
                      ),
          ),
        ]),
      ),
    );
  }

  Widget _card(InspireItem i) {
    return GestureDetector(
      onTap: () => _open(i),
      child: Container(
        decoration: BoxDecoration(color: AppColors.dark, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.glass)),
        child: Row(children: [
          ClipRRect(borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)), child: CachedNetworkImage(imageUrl: pexelsUrl(i.poster, w: 300), width: 110, height: 96, fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(width: 110, height: 96, color: AppColors.dark))),
          Expanded(child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: genreColor(i.category), borderRadius: BorderRadius.circular(4)), child: Text(i.category.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white))),
            const SizedBox(height: 6),
            Text(i.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
            if (i.quote != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('"${i.quote}"', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: AppColors.gold))),
            if (i.attribution != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('— ${i.attribution}', style: const TextStyle(fontSize: 10, color: AppColors.muted))),
          ]))),
          const Padding(padding: EdgeInsets.only(right: 12), child: Icon(Icons.play_circle_fill, color: AppColors.red, size: 32)),
        ]),
      ),
    );
  }
}
