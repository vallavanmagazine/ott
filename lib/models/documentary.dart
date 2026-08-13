import '../utils/formatters.dart';

class Documentary {
  final String id;
  final String title;
  final String titleTa;
  final String genre;
  final int durationSec;
  final String poster;
  final String backdrop;
  final int year;
  final String language;
  final String synopsis;
  final String synopsisTa;
  final String? badge;
  final double? progress;
  final bool exclusive;
  final String? director;
  final List<String> cast;
  final String? videoUrl;

  const Documentary({
    required this.id,
    required this.title,
    required this.titleTa,
    required this.genre,
    required this.durationSec,
    required this.poster,
    required this.backdrop,
    required this.year,
    required this.language,
    required this.synopsis,
    required this.synopsisTa,
    this.badge,
    this.progress,
    this.exclusive = false,
    this.director,
    this.cast = const [],
    this.videoUrl,
  });

  String get duration => formatDuration(durationSec);

  factory Documentary.fromMap(Map<String, dynamic> r) => Documentary(
        id: r['id'].toString(),
        title: r['title'] ?? '',
        titleTa: r['title_ta'] ?? '',
        genre: r['genre'] ?? 'Society',
        durationSec: (r['duration_sec'] ?? 0) as int,
        poster: r['poster'] ?? '',
        backdrop: r['backdrop'] ?? r['poster'] ?? '',
        year: (r['year'] ?? 2024) as int,
        language: r['language'] ?? 'Tamil',
        synopsis: r['synopsis'] ?? '',
        synopsisTa: r['synopsis_ta'] ?? '',
        badge: r['badge'],
        progress: (r['progress'] as num?)?.toDouble(),
        exclusive: r['exclusive'] == true,
        director: r['director'],
        cast: (r['cast'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        videoUrl: r['video_url'],
      );

  Map<String, dynamic> toJson() => {
        'id': id, 'title': title, 'titleTa': titleTa, 'genre': genre, 'durationSec': durationSec,
        'poster': poster, 'backdrop': backdrop, 'year': year, 'language': language,
        'synopsis': synopsis, 'synopsisTa': synopsisTa, 'badge': badge, 'exclusive': exclusive,
        'director': director, 'cast': cast, 'videoUrl': videoUrl,
      };

  factory Documentary.fromJson(Map<String, dynamic> j) => Documentary(
        id: j['id'].toString(),
        title: j['title'] ?? '',
        titleTa: j['titleTa'] ?? '',
        genre: j['genre'] ?? 'Society',
        durationSec: (j['durationSec'] ?? 0) as int,
        poster: j['poster'] ?? '',
        backdrop: j['backdrop'] ?? '',
        year: (j['year'] ?? 2024) as int,
        language: j['language'] ?? 'Tamil',
        synopsis: j['synopsis'] ?? '',
        synopsisTa: j['synopsisTa'] ?? '',
        badge: j['badge'],
        exclusive: j['exclusive'] == true,
        director: j['director'],
        cast: (j['cast'] as List?)?.map((e) => e.toString()).toList() ?? const [],
        videoUrl: j['videoUrl'],
      );
}
