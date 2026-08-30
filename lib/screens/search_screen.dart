import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/env.dart';
import '../config/theme.dart';
import '../models/search_hit.dart';
import '../services/preferences_service.dart';
import '../services/search_service.dart';
import 'detail_screen.dart';
import 'reel_detail_screen.dart';

/// Tab 1 — Search. Filters the prefetched index live as the user types; shows
/// recent + trending terms while the query is empty.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  List<SearchHit> _index = [];
  List<String> _recent = [];
  List<String> _trending = [];
  String _q = '';
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    SearchService.fetchIndex().then((i) {
      if (mounted) setState(() { _index = i; _loading = false; });
    });
    SearchService.fetchTrending().then((t) { if (mounted) setState(() => _trending = t); });
    Prefs.recentSearches().then((r) { if (mounted) setState(() => _recent = r); });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  List<SearchHit> get _results => _index.where((h) => h.matches(_q)).toList();

  Future<void> _apply(String q) async {
    setState(() { _q = q; _ctrl.text = q; });
    _ctrl.selection = TextSelection.fromPosition(TextPosition(offset: q.length));
    if (q.trim().isEmpty) return;
    await Prefs.addRecentSearch(q);
    final r = await Prefs.recentSearches();
    if (mounted) setState(() => _recent = r);
  }

  void _open(SearchHit hit) {
    final route = hit.doc != null
        ? MaterialPageRoute<void>(builder: (_) => DetailScreen(item: hit.doc!))
        : MaterialPageRoute<void>(builder: (_) => ReelDetailScreen(reel: hit.reel!));
    Navigator.push(context, route);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
          child: Container(
            height: 46,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: AppColors.glass,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: Colors.white12),
            ),
            child: Row(children: [
              const Icon(Icons.search, size: 19, color: AppColors.muted),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  textInputAction: TextInputAction.search,
                  onChanged: (v) => setState(() => _q = v),
                  onSubmitted: _apply,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: InputBorder.none,
                    hintText: 'Search documentaries, reels, genres...',
                    hintStyle: TextStyle(color: AppColors.muted, fontSize: 13),
                  ),
                ),
              ),
              if (_q.isNotEmpty)
                GestureDetector(
                  onTap: () => setState(() { _q = ''; _ctrl.clear(); }),
                  child: const Icon(Icons.close, size: 18, color: AppColors.muted),
                ),
            ]),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator(color: AppColors.red))
              : (_q.trim().isEmpty ? _suggestions() : _resultsList()),
        ),
      ]),
    );
  }

  Widget _suggestions() => ListView(padding: const EdgeInsets.fromLTRB(16, 6, 16, 24), children: [
        if (_recent.isNotEmpty) ...[
          const _SectionLabel('RECENT'),
          ..._recent.map((s) => ListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                leading: const Icon(Icons.history, color: AppColors.muted, size: 18),
                title: Text(s, style: const TextStyle(color: Colors.white, fontSize: 14)),
                onTap: () => _apply(s),
              )),
          const SizedBox(height: 16),
        ],
        if (_trending.isNotEmpty) ...[
          const _SectionLabel('TRENDING'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _trending
                .map((s) => GestureDetector(
                      onTap: () => _apply(s),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                        decoration: BoxDecoration(
                          color: AppColors.glass,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(color: Colors.white12),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.trending_up, size: 13, color: AppColors.gold),
                          const SizedBox(width: 6),
                          Text(s, style: const TextStyle(fontSize: 12, color: Colors.white)),
                        ]),
                      ),
                    ))
                .toList(),
          ),
        ],
        if (_recent.isEmpty && _trending.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 60),
            child: Center(child: Text('Search Vallavan', style: TextStyle(color: AppColors.muted))),
          ),
      ]);

  Widget _resultsList() {
    final r = _results;
    if (r.isEmpty) {
      // Same trap as the Feed: with no Supabase key the search index is empty,
      // so every query "finds nothing" and looks like a content problem rather
      // than a build problem. Name the real cause.
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(
            !Env.isConfigured
                ? 'This build has no Supabase key, so there is nothing to '
                    'search. Rebuild with '
                    '--dart-define-from-file=dart_defines.json.'
                : 'No results found',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.muted),
          ),
        ),
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
      itemCount: r.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _ResultCard(hit: r[i], onTap: () => _open(r[i])),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(text,
      style: const TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold));
}

/// Result row: thumbnail, Tamil title (bold, primary), English title, duration.
class _ResultCard extends StatelessWidget {
  final SearchHit hit;
  final VoidCallback onTap;
  const _ResultCard({required this.hit, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: CachedNetworkImage(
            imageUrl: pexelsUrl(hit.thumb, w: 320),
            width: 116,
            height: 70,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => Container(width: 116, height: 70, color: AppColors.dark),
            placeholder: (_, __) => Container(width: 116, height: 70, color: AppColors.dark),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Tamil title is primary: bold and larger. English sits beneath.
            Text(
              hit.titleTa.isNotEmpty ? hit.titleTa : hit.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: tamilStyle(size: 15, color: Colors.white, weight: FontWeight.bold),
            ),
            if (hit.titleTa.isNotEmpty)
              Text(hit.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12, color: AppColors.muted)),
            const SizedBox(height: 6),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: genreColor(hit.genre), borderRadius: BorderRadius.circular(4)),
                child: Text(hit.kind.toUpperCase(),
                    style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.white)),
              ),
              const SizedBox(width: 8),
              Text(hit.duration, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
            ]),
          ]),
        ),
      ]),
    );
  }
}
