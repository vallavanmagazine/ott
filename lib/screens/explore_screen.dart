import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../services/documentaries_service.dart';
import '../widgets/category_chips.dart';
import '../widgets/content_card.dart';
import '../widgets/loading_skeleton.dart';
import '../widgets/vallavan_header.dart';
import 'detail_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  List<Documentary> _docs = [];
  bool _loading = true;
  String _genre = 'All';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final d = await DocumentariesService.fetchAll();
    if (mounted) setState(() { _docs = d; _loading = false; });
  }

  void _open(Documentary d) => Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(item: d)));

  @override
  Widget build(BuildContext context) {
    final filtered = _genre == 'All' ? _docs : _docs.where((d) => d.genre == _genre).toList();
    final featured = _docs.isNotEmpty ? _docs.first : null;

    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        bottom: false,
        child: Column(children: [
          const VallavanHeader(notificationCount: 3),
          Expanded(
            child: _loading
                ? const Center(child: LoadingSkeleton(width: 200, height: 20))
                : RefreshIndicator(
                    color: AppColors.red,
                    backgroundColor: AppColors.dark,
                    onRefresh: _load,
                    child: CustomScrollView(slivers: [
                      if (featured != null) SliverToBoxAdapter(child: _hero(featured)),
                      SliverToBoxAdapter(
                        child: FilterChipsBar(options: const ['All', ...K.genres], active: _genre, onSelected: (g) => setState(() => _genre = g)),
                      ),
                      const SliverToBoxAdapter(child: SizedBox(height: 12)),
                      filtered.isEmpty
                          ? const SliverToBoxAdapter(child: Padding(padding: EdgeInsets.all(40), child: Center(child: Text('No documentaries', style: TextStyle(color: AppColors.muted)))))
                          : SliverPadding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              sliver: SliverGrid(
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.62, crossAxisSpacing: 12, mainAxisSpacing: 16),
                                delegate: SliverChildBuilderDelegate(
                                  (_, i) => ContentCard(item: filtered[i], width: double.infinity, onTap: () => _open(filtered[i])),
                                  childCount: filtered.length,
                                ),
                              ),
                            ),
                    ]),
                  ),
          ),
        ]),
      ),
    );
  }

  Widget _hero(Documentary d) {
    return GestureDetector(
      onTap: () => _open(d),
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
        height: 190,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(borderRadius: BorderRadius.circular(18)),
        child: Stack(fit: StackFit.expand, children: [
          CachedNetworkImage(imageUrl: pexelsUrl(d.backdrop, w: 900), fit: BoxFit.cover, errorWidget: (_, __, ___) => Container(color: AppColors.dark)),
          const DecoratedBox(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black87]))),
          Positioned(left: 16, right: 16, bottom: 14, child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(color: AppColors.red, borderRadius: BorderRadius.circular(4)),
              child: const Text('FEATURED', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1, color: Colors.white)),
            ),
            const SizedBox(height: 8),
            Text(d.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white)),
            const SizedBox(height: 2),
            Text('${d.genre} • ${d.duration}', style: const TextStyle(fontSize: 12, color: Colors.white70)),
          ])),
        ]),
      ),
    );
  }
}
