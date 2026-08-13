import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/ad_content.dart';
import '../models/documentary.dart';
import '../services/ads_service.dart';
import '../services/documentaries_service.dart';
import '../widgets/ad_banner.dart';
import '../widgets/content_card.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/loading_skeleton.dart';
import '../widgets/vallavan_logo.dart';
import 'detail_screen.dart';
import 'live_tv_screen.dart';
import 'notifications_screen.dart';
import 'search_screen.dart';
import 'video_player_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onSeeAll;
  const HomeScreen({super.key, required this.onSeeAll});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Documentary> _docs = [];
  List<AdContent> _ads = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final docs = await DocumentariesService.fetchAll();
    final ads = await AdsService.fetchAll();
    if (!mounted) return;
    setState(() { _docs = docs; _ads = ads; _loading = false; });
  }

  void _openDetail(Documentary d) => Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(item: d)));
  void _openPlayer(Documentary d) => Navigator.push(context, MaterialPageRoute(builder: (_) => VideoPlayerScreen(item: d)));

  @override
  Widget build(BuildContext context) {
    final featured = _docs.take(3).toList();
    final popular = _docs.skip(2).take(5).toList();
    final newReleases = _docs.where((d) => d.badge == 'NEW').toList();
    final editors = _docs.where((d) => d.exclusive).toList();

    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.red,
          onRefresh: _load,
          child: ListView(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 12, 8),
              child: Row(children: [
                const VallavanLogo(size: 34, showWordmark: true),
                const Spacer(),
                IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LiveTvScreen())), icon: const Icon(Icons.live_tv, color: Colors.white70)),
                IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())), icon: const Icon(Icons.notifications_none, color: Colors.white70)),
                IconButton(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen())), icon: const Icon(Icons.search, color: Colors.white70)),
              ]),
            ),
            if (_loading) ...[const SizedBox(height: 12), const RowSkeleton(), const SizedBox(height: 16), const RowSkeleton()]
            else ...[
              HeroCarousel(items: featured, onWatch: _openPlayer),
              Padding(padding: const EdgeInsets.all(16), child: _ads.isNotEmpty ? AdBanner(ad: _ads[0]) : const SizedBox.shrink()),
              _row('Popular Documentaries', popular),
              if (_ads.length > 1) Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 0), child: AdBanner(ad: _ads[1])),
              _row('New Releases', newReleases),
              _row("Editor's Choice", editors),
              const SizedBox(height: 24),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _row(String title, List<Documentary> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Colors.white)),
          GestureDetector(onTap: widget.onSeeAll, child: const Text('See all', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.red))),
        ]),
      ),
      SizedBox(height: 160, child: ListView.separated(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), itemCount: items.length, separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) => ContentCard(item: items[i], width: 220, onTap: () => _openDetail(items[i])))),
    ]);
  }
}
