import '../utils/formatters.dart';

class FeedReel {
  final String id;
  final String title;
  final String titleTa;
  final String caption;
  final String captionTa;
  final String creator;
  final String creatorHandle;
  final String contentType;
  final String genre;
  final int durationSec;
  final String thumb;
  final int likes;
  final int comments;
  final int shares;
  final int views;
  final bool stripAdHost;
  final bool bannerAfter;
  final int order;
  final String? videoUrl;

  const FeedReel({
    required this.id,
    required this.title,
    required this.titleTa,
    required this.caption,
    required this.captionTa,
    required this.creator,
    required this.creatorHandle,
    required this.contentType,
    required this.genre,
    required this.durationSec,
    required this.thumb,
    this.likes = 0,
    this.comments = 0,
    this.shares = 0,
    this.views = 0,
    this.stripAdHost = false,
    this.bannerAfter = false,
    this.order = 0,
    this.videoUrl,
  });

  String get duration => formatDuration(durationSec);

  factory FeedReel.fromMap(Map<String, dynamic> r) => FeedReel(
        id: r['id'].toString(),
        title: r['title'] ?? '',
        titleTa: r['title_ta'] ?? '',
        caption: r['caption'] ?? '',
        captionTa: r['caption_ta'] ?? '',
        creator: r['creator'] ?? '',
        creatorHandle: r['creator_handle'] ?? '',
        contentType: r['content_type'] ?? 'Other',
        genre: r['genre'] ?? 'Society',
        durationSec: (r['duration_sec'] ?? 30) as int,
        thumb: r['thumb'] ?? '',
        likes: (r['likes'] ?? 0) as int,
        comments: (r['comments'] ?? 0) as int,
        shares: (r['shares'] ?? 0) as int,
        views: (r['views'] ?? 0) as int,
        stripAdHost: r['strip_ad_host'] == true,
        bannerAfter: r['banner_after'] == true,
        order: (r['sort_order'] ?? 0) as int,
        videoUrl: r['video_url'],
      );
}
