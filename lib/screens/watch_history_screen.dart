import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../utils/library.dart';
import '../widgets/content_card.dart';
import 'video_player_screen.dart';

class WatchHistoryScreen extends StatefulWidget {
  const WatchHistoryScreen({super.key});
  @override
  State<WatchHistoryScreen> createState() => _WatchHistoryScreenState();
}

class _WatchHistoryScreenState extends State<WatchHistoryScreen> {
  List<Documentary> _items = [];

  @override
  void initState() {
    super.initState();
    Library.history().then((v) { if (mounted) setState(() => _items = v); });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Watch History', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black,
        actions: [if (_items.isNotEmpty) TextButton(onPressed: () async { await Library.clearHistory(); setState(() => _items = []); }, child: const Text('Clear', style: TextStyle(color: AppColors.muted)))],
      ),
      body: _items.isEmpty
          ? const Center(child: Text('Nothing watched yet', style: TextStyle(color: AppColors.muted)))
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.62, crossAxisSpacing: 12, mainAxisSpacing: 16),
              itemCount: _items.length,
              itemBuilder: (_, i) => ContentCard(item: _items[i], width: double.infinity, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VideoPlayerScreen(item: _items[i])))),
            ),
    );
  }
}
