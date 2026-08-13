import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../utils/library.dart';
import '../widgets/content_card.dart';
import 'detail_screen.dart';

class WatchLaterScreen extends StatefulWidget {
  const WatchLaterScreen({super.key});
  @override
  State<WatchLaterScreen> createState() => _WatchLaterScreenState();
}

class _WatchLaterScreenState extends State<WatchLaterScreen> {
  List<Documentary> _items = [];

  @override
  void initState() {
    super.initState();
    Library.watchLater().then((v) { if (mounted) setState(() => _items = v); });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(title: const Text('Watch Later', style: TextStyle(fontWeight: FontWeight.w900)), backgroundColor: AppColors.black),
      body: _items.isEmpty
          ? const Center(child: Text('No saved titles', style: TextStyle(color: AppColors.muted)))
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.62, crossAxisSpacing: 12, mainAxisSpacing: 16),
              itemCount: _items.length,
              itemBuilder: (_, i) => ContentCard(item: _items[i], width: double.infinity, onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => DetailScreen(item: _items[i])))),
            ),
    );
  }
}
