import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../models/ad_content.dart';
import '../../services/sponsor_service.dart';
import '../../widgets/ad_banner.dart';
import 'ai_studio_screen.dart';

/// The sponsor's saved ad creatives — preview, edit, delete.
class CreativeLibraryScreen extends StatefulWidget {
  const CreativeLibraryScreen({super.key});
  @override
  State<CreativeLibraryScreen> createState() => _CreativeLibraryScreenState();
}

class _CreativeLibraryScreenState extends State<CreativeLibraryScreen> {
  List<AdContent> _creatives = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await SponsorService.fetchCreatives();
    if (mounted) setState(() { _creatives = list; _loading = false; });
  }

  Future<void> _edit(AdContent ad) async {
    final headline = TextEditingController(text: ad.headline);
    final body = TextEditingController(text: ad.body);
    final cta = TextEditingController(text: ad.cta);
    final image = TextEditingController(text: ad.bgImage);

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.dark,
        title: const Text('Edit Creative', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            _dialogField(headline, 'Headline'),
            _dialogField(body, 'Body'),
            _dialogField(cta, 'Call to action'),
            _dialogField(image, 'Image (Pexels id or URL)'),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.red),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (saved != true) return;
    final err = await SponsorService.updateCreative(
      ad.id,
      headline: headline.text,
      body: body.text,
      cta: cta.text,
      bgImage: image.text,
    );
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Save failed: $err')));
      return;
    }
    _load();
  }

  Future<void> _delete(AdContent ad) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.dark,
        title: const Text('Delete creative?', style: TextStyle(color: Colors.white, fontSize: 16)),
        content: Text('"${ad.headline}" will be removed permanently.',
            style: const TextStyle(color: AppColors.muted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final err = await SponsorService.deleteCreative(ad.id);
    if (!mounted) return;
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $err')));
      return;
    }
    _load();
  }

  Widget _dialogField(TextEditingController c, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: TextField(
          controller: c,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            labelText: label,
            labelStyle: const TextStyle(color: AppColors.muted, fontSize: 12),
            filled: true,
            fillColor: AppColors.glass,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.black,
      appBar: AppBar(
        title: const Text('Creative Library', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: AppColors.black,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.red,
        onPressed: () async {
          await Navigator.push(context, MaterialPageRoute<void>(builder: (_) => const AiStudioScreen()));
          if (mounted) _load();
        },
        icon: const Icon(Icons.auto_awesome, color: Colors.white),
        label: const Text('AI Studio', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.red))
          : _creatives.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text('No creatives yet.\nUse AI Studio to generate your first ad.',
                        textAlign: TextAlign.center, style: TextStyle(color: AppColors.muted)),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                  itemCount: _creatives.length,
                  itemBuilder: (_, i) {
                    final ad = _creatives[i];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 18),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        AdBanner(ad: ad),
                        const SizedBox(height: 8),
                        Row(children: [
                          Expanded(
                            child: Text(ad.body,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: AppColors.muted, fontSize: 12)),
                          ),
                          IconButton(
                            onPressed: () => _edit(ad),
                            icon: const Icon(Icons.edit_outlined, size: 19, color: Colors.white70),
                            tooltip: 'Edit',
                          ),
                          IconButton(
                            onPressed: () => _delete(ad),
                            icon: const Icon(Icons.delete_outline, size: 19, color: AppColors.red),
                            tooltip: 'Delete',
                          ),
                        ]),
                      ]),
                    );
                  },
                ),
    );
  }
}
