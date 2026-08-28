import '../models/documentary.dart';
import '../models/feed_reel.dart';

/// A single searchable row, projected from either a documentary or a feed reel
/// so the results list can render one card type across both Supabase tables.
class SearchHit {
  final String id;
  final String title;
  final String titleTa;
  final String thumb;
  final String duration;
  final String kind; // 'Documentary' | 'Reel'
  final String genre;

  /// The source row, kept so tapping a hit can open the right detail screen.
  final Documentary? doc;
  final FeedReel? reel;

  const SearchHit({
    required this.id,
    required this.title,
    required this.titleTa,
    required this.thumb,
    required this.duration,
    required this.kind,
    required this.genre,
    this.doc,
    this.reel,
  });

  factory SearchHit.fromDoc(Documentary d) => SearchHit(
        id: 'doc-${d.id}',
        title: d.title,
        titleTa: d.titleTa,
        thumb: d.poster,
        duration: d.duration,
        kind: 'Documentary',
        genre: d.genre,
        doc: d,
      );

  factory SearchHit.fromReel(FeedReel r) => SearchHit(
        id: 'reel-${r.id}',
        title: r.title,
        titleTa: r.titleTa,
        thumb: r.thumb,
        duration: r.duration,
        kind: 'Reel',
        genre: r.genre,
        reel: r,
      );

  /// Case-insensitive match across English title, Tamil title and genre.
  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return false;
    return title.toLowerCase().contains(q) ||
        titleTa.toLowerCase().contains(q) ||
        genre.toLowerCase().contains(q) ||
        kind.toLowerCase().contains(q);
  }
}
