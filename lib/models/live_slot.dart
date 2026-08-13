import '../utils/formatters.dart';

class LiveSlot {
  final String id;
  final String title;
  final String titleTa;
  final String description;
  final String thumb;
  final String startTime24;
  final int durationMin;
  final bool isLive;
  final String? videoUrl;

  const LiveSlot({
    required this.id,
    required this.title,
    required this.titleTa,
    required this.description,
    required this.thumb,
    required this.startTime24,
    required this.durationMin,
    this.isLive = false,
    this.videoUrl,
  });

  String get time => format12Hour(startTime24);
  String get duration => formatMinutes(durationMin);

  factory LiveSlot.fromMap(Map<String, dynamic> r) => LiveSlot(
        id: r['id'].toString(),
        title: r['title'] ?? '',
        titleTa: r['title_ta'] ?? '',
        description: r['description'] ?? '',
        thumb: r['thumb'] ?? '',
        startTime24: r['start_time24'] ?? '18:00',
        durationMin: (r['duration_min'] ?? 30) as int,
        isLive: r['is_live'] == true,
        videoUrl: r['video_url'],
      );
}
