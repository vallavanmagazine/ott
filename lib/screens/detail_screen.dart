import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../services/documentaries_service.dart';
import '../utils/library.dart';
import '../widgets/content_card.dart';
import 'video_player_screen.dart';

class DetailScreen extends StatefulWidget {
  final Documentary item;
  const DetailScreen({super.key, required this.item});
  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  bool _saved = false;
  List<Documentary> _related = [];

  @override
  void initState() {
    super.initState();
    Library.isWatchLater(widget.item.id).then((v) { if (mounted) setState(() => _saved = v); });
    DocumentariesService.related(widget.item.genre, widget.item.id).then((r) { if (mounted) setState(() => _related = r); });
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.item;
    return Scaffold(
      backgroundColor: AppColors.black,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 240, pinned: true, backgroundColor: AppColors.black,
          leading: IconButton(icon: const Icon(Icons.chevron_left), onPressed: () => Navigator.pop(context)),
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(fit: StackFit.expand, children: [
              CachedNetworkImage(imageUrl: pexelsUrl(d.backdrop, w: 1280), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
              const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, AppColors.black]))),
            ]),
          ),
        ),
        SliverToBoxAdapter(child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(d.title, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white)),
            Text(d.titleTa, style: tamilStyle(size: 16, color: AppColors.gold)),
            const SizedBox(height: 8),
            Row(children: [
              Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: genreColor(d.genre), borderRadius: BorderRadius.circular(4)), child: Text(d.genre.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white))),
              const SizedBox(width: 8),
              Text('${d.year} · ${d.duration} · ${d.language}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
            ]),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: FilledButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VideoPlayerScreen(item: d))),
                icon: const Icon(Icons.play_arrow), label: const Text('Watch Now'),
                style: FilledButton.styleFrom(backgroundColor: AppColors.red, padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              )),
              const SizedBox(width: 10),
              IconButton.filled(
                onPressed: () async { final s = await Library.toggleWatchLater(d); if (mounted) setState(() => _saved = s); },
                icon: Icon(_saved ? Icons.check : Icons.add),
                style: IconButton.styleFrom(backgroundColor: AppColors.glass, foregroundColor: _saved ? AppColors.gold : Colors.white),
              ),
            ]),
            if (d.synopsis.isNotEmpty) ...[const SizedBox(height: 18), const Text('SYNOPSIS', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)), const SizedBox(height: 6), Text(d.synopsis, style: const TextStyle(fontSize: 14, height: 1.5, color: Colors.white70))],
            if (d.director != null || d.cast.isNotEmpty) ...[
              const SizedBox(height: 16), const Text('CAST & CREW', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)), const SizedBox(height: 6),
              if (d.director != null) Text('Director: ${d.director}', style: const TextStyle(fontSize: 13, color: Colors.white)),
              if (d.cast.isNotEmpty) Text('Featuring: ${d.cast.join(', ')}', style: const TextStyle(fontSize: 13, color: Colors.white)),
            ],
          ]),
        )),
        if (_related.isNotEmpty) SliverToBoxAdapter(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Padding(padding: EdgeInsets.fromLTRB(16, 8, 16, 10), child: Text('More Like This', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white))),
          SizedBox(height: 160, child: ListView.separated(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), itemCount: _related.length, separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => ContentCard(item: _related[i], width: 220, onTap: () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => DetailScreen(item: _related[i])))))),
          const SizedBox(height: 24),
        ])),
      ]),
    );
  }
}
