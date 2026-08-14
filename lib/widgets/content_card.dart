import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../config/constants.dart';
import '../config/theme.dart';
import '../models/documentary.dart';
import '../utils/library.dart';

/// Documentary card: poster + title + duration badge + genre tag. Tappable.
class ContentCard extends StatefulWidget {
  final Documentary item;
  final VoidCallback onTap;
  final double width;
  const ContentCard({super.key, required this.item, required this.onTap, this.width = 220});

  @override
  State<ContentCard> createState() => _ContentCardState();
}

class _ContentCardState extends State<ContentCard> {
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    Library.isWatchLater(widget.item.id).then((v) { if (mounted) setState(() => _saved = v); });
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.item;
    return GestureDetector(
      onTap: widget.onTap,
      child: SizedBox(
        width: widget.width,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Stack(children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: CachedNetworkImage(
                  imageUrl: pexelsUrl(d.poster, w: 400),
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.dark),
                  errorWidget: (_, __, ___) => Container(color: AppColors.dark, child: const Icon(Icons.movie, color: AppColors.muted)),
                ),
              ),
              if (d.badge != null)
                Positioned(top: 8, left: 8, child: _pill(d.badge!, d.badge == 'FEATURED' ? AppColors.gold : AppColors.red, d.badge == 'FEATURED' ? Colors.black : Colors.white)),
              Positioned(
                bottom: 8, right: 8,
                child: Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(4)),
                  child: Text(d.duration, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white))),
              ),
              Positioned(
                bottom: 8, left: 8,
                child: GestureDetector(
                  onTap: () async { final s = await Library.toggleWatchLater(d); if (mounted) setState(() => _saved = s); },
                  child: Container(width: 28, height: 28, decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), shape: BoxShape.circle),
                    child: Icon(_saved ? Icons.check : Icons.add, size: 16, color: _saved ? AppColors.gold : Colors.white)),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 8),
          // Tamil primary (bold, larger, white); English secondary (grey).
          Text(d.titleTa.isNotEmpty ? d.titleTa : d.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: tamilStyle(size: 14, color: Colors.white, weight: FontWeight.bold)),
          Text(d.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
          const SizedBox(height: 4),
          Row(children: [
            _pill(d.genre, genreColor(d.genre), Colors.white, small: true),
            const SizedBox(width: 6),
            Text('${d.year}', style: const TextStyle(fontSize: 9, color: AppColors.muted)),
          ]),
        ]),
      ),
    );
  }

  Widget _pill(String text, Color bg, Color fg, {bool small = false}) => Container(
        padding: EdgeInsets.symmetric(horizontal: small ? 5 : 6, vertical: small ? 2 : 2),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(4)),
        child: Text(text.toUpperCase(), style: TextStyle(fontSize: small ? 8 : 9, fontWeight: FontWeight.w900, color: fg, letterSpacing: 0.5)),
      );
}
