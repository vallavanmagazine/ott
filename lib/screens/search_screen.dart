import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../services/documentaries_service.dart';
import '../services/preferences_service.dart';
import '../services/supabase_client.dart';
import '../widgets/content_card.dart';
import 'detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  List<Documentary> _all = [];
  List<String> _recent = [];
  List<String> _trending = [];
  String _q = '';

  @override
  void initState() {
    super.initState();
    DocumentariesService.fetchAll().then((d) { if (mounted) setState(() => _all = d); });
    Prefs.recentSearches().then((r) { if (mounted) setState(() => _recent = r); });
    _loadTrending();
  }

  Future<void> _loadTrending() async {
    final c = Db.client;
    if (c == null) return;
    try {
      final data = await c.from('trending_searches').select('term').order('sort_order');
      if (mounted) setState(() => _trending = (data as List).map((e) => e['term'].toString()).toList());
    } catch (_) {}
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  List<Documentary> get _results {
    if (_q.isEmpty) return [];
    final q = _q.toLowerCase();
    return _all.where((d) => d.title.toLowerCase().contains(q) || d.titleTa.contains(_q) || d.genre.toLowerCase().contains(q)).toList();
  }

  void _submit(String q) { setState(() { _q = q; _ctrl.text = q; }); Prefs.addRecentSearch(q); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        backgroundColor: AppColors.black,
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
        title: TextField(
          controller: _ctrl, autofocus: true, style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(hintText: 'Search documentaries, genres…', hintStyle: TextStyle(color: AppColors.muted), border: InputBorder.none),
          onChanged: (v) => setState(() => _q = v),
          onSubmitted: _submit,
        ),
      ),
      body: _q.isEmpty ? _suggestions() : _resultsGrid(),
    );
  }

  Widget _suggestions() => ListView(padding: const EdgeInsets.all(16), children: [
        if (_recent.isNotEmpty) ...[
          const Text('RECENT', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
          ..._recent.map((s) => ListTile(contentPadding: EdgeInsets.zero, leading: const Icon(Icons.history, color: AppColors.muted, size: 18), title: Text(s, style: const TextStyle(color: Colors.white, fontSize: 14)), onTap: () => _submit(s))),
          const SizedBox(height: 12),
        ],
        const Text('TRENDING', style: TextStyle(fontSize: 10, letterSpacing: 1, color: AppColors.muted, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: _trending.map((s) => GestureDetector(onTap: () => _submit(s), child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: AppColors.glass, borderRadius: BorderRadius.circular(999)), child: Text(s, style: const TextStyle(fontSize: 12, color: Colors.white))))).toList()),
      ]);

  Widget _resultsGrid() {
    final r = _results;
    if (r.isEmpty) return const Center(child: Text('No results found', style: TextStyle(color: AppColors.muted)));
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.62, crossAxisSpacing: 12, mainAxisSpacing: 16),
      itemCount: r.length,
      itemBuilder: (_, i) => ContentCard(item: r[i], width: double.infinity, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(item: r[i])))),
    );
  }
}
