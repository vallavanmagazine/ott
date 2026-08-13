import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../services/documentaries_service.dart';
import '../widgets/category_chips.dart';
import '../widgets/content_card.dart';
import '../widgets/loading_skeleton.dart';
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
    DocumentariesService.fetchAll().then((d) { if (mounted) setState(() { _docs = d; _loading = false; }); });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _genre == 'All' ? _docs : _docs.where((d) => d.genre == _genre).toList();
    return Scaffold(
      backgroundColor: AppColors.black,
      body: SafeArea(
        child: Column(children: [
          const Padding(padding: EdgeInsets.fromLTRB(16, 12, 16, 8), child: Align(alignment: Alignment.centerLeft, child: Text('Explore', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.white)))),
          FilterChipsBar(options: const ['All', ...K.genres], active: _genre, onSelected: (g) => setState(() => _genre = g)),
          const SizedBox(height: 12),
          Expanded(
            child: _loading
                ? const Center(child: LoadingSkeleton(width: 200, height: 20))
                : filtered.isEmpty
                    ? const Center(child: Text('No documentaries', style: TextStyle(color: AppColors.muted)))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.62, crossAxisSpacing: 12, mainAxisSpacing: 16),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => ContentCard(item: filtered[i], width: double.infinity, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(item: filtered[i])))),
                      ),
          ),
        ]),
      ),
    );
  }
}
