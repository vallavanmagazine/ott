import '../utils/formatters.dart';

class InspireItem {
  final String id;
  final String title;
  final String titleTa;
  final String category;
  final int durationSec;
  final String poster;
  final String? quote;
  final String? attribution;
  final String? badge;
  final String? videoUrl;

  const InspireItem({
    required this.id,
    required this.title,
    required this.titleTa,
    required this.category,
    required this.durationSec,
    required this.poster,
    this.quote,
    this.attribution,
    this.badge,
    this.videoUrl,
  });

  String get duration => formatDuration(durationSec);

  factory InspireItem.fromMap(Map<String, dynamic> r) => InspireItem(
        id: r['id'].toString(),
        title: r['title'] ?? '',
        titleTa: r['title_ta'] ?? '',
        category: r['category'] ?? 'Motivation',
        durationSec: (r['duration_sec'] ?? 180) as int,
        poster: r['poster'] ?? '',
        quote: r['quote'],
        attribution: r['attribution'],
        badge: r['badge'],
        videoUrl: r['video_url'],
      );
}
