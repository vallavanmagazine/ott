/// Video URL helpers — the Flutter counterpart of the web app's `lib/video.ts`.
///
/// Both apps read and write the same Supabase `video_url` columns, so the URL
/// shapes they accept and the canonical form they store must agree exactly.
/// [youTubeId] and [toEmbedUrl] are therefore a deliberate 1:1 port of the web
/// implementation; changing one without the other lets the two clients disagree
/// about what a stored row means.
///
/// Where the two platforms legitimately differ is playback:
///   - Web plays YouTube in an `<iframe>`, which only accepts `/embed/{id}` —
///     YouTube refuses to frame watch/shorts links (X-Frame-Options).
///   - Flutter has no webview here. It hands the URL to the OS via url_launcher
///     so the YouTube app takes it, and the app matches `watch?v=` links, not
///     `/embed/` ones. That is what [toWatchUrl] is for.
///
/// Four source kinds appear in the CMS: YouTube, DyneTube, HLS (.m3u8) for the
/// live channel, and plain MP4. Only the last three decode natively.
library;

enum VideoKind { youtube, hls, mp4, dynetube, none }

/// Every YouTube URL shape the CMS accepts, each capturing the 11-char id.
///
/// Covers watch, youtu.be, embed, shorts, live and the legacy `/v/` path. The
/// patterns match on a substring, so `m.` and `music.` subdomains and a missing
/// protocol all work without extra alternatives, and trailing params (`?si=`,
/// `&t=`) are simply not consumed.
final List<RegExp> _youTubePatterns = [
  RegExp(r'youtube\.com/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})'),
  RegExp(r'youtu\.be/([A-Za-z0-9_-]{11})'),
  RegExp(r'youtube(?:-nocookie)?\.com/embed/([A-Za-z0-9_-]{11})'),
  RegExp(r'youtube\.com/shorts/([A-Za-z0-9_-]{11})'),
  RegExp(r'youtube\.com/live/([A-Za-z0-9_-]{11})'),
  RegExp(r'youtube\.com/v/([A-Za-z0-9_-]{11})'),
];

/// The 11-char YouTube video id, or null when this is not a YouTube link.
String? youTubeId(String? url) {
  if (url == null || url.isEmpty) return null;
  for (final re in _youTubePatterns) {
    final m = re.firstMatch(url);
    if (m != null) return m.group(1);
  }
  return null;
}

/// True when [url] points at YouTube in any of its URL shapes.
bool isYouTube(String? url) => youTubeId(url) != null;

/// Canonical storage form, identical to the web app's `toEmbedUrl`.
///
/// Any YouTube link becomes `https://www.youtube.com/embed/{id}`. Non-YouTube
/// sources (DyneTube, HLS, MP4) are returned trimmed but otherwise untouched.
/// Idempotent: an embed URL converts to itself.
///
/// Apply this at every write boundary rather than at the form, so a second
/// writer added later cannot bypass it.
String? toEmbedUrl(String? url) {
  if (url == null) return null;
  final trimmed = url.trim();
  if (trimmed.isEmpty) return null;
  final id = youTubeId(trimmed);
  return id != null ? 'https://www.youtube.com/embed/$id' : trimmed;
}

/// The form to hand the OS when opening a YouTube video externally.
///
/// The Android/iOS YouTube app registers for `watch?v=` and `youtu.be` links,
/// not `/embed/`, so launching a stored embed URL would fall through to the
/// browser and show a bare player chrome. Rebuilt from the id rather than
/// string-replacing `/embed/`, so shorts, live and legacy rows also resolve.
/// Non-YouTube URLs pass through unchanged.
String toWatchUrl(String url) {
  final id = youTubeId(url);
  return id != null ? 'https://www.youtube.com/watch?v=$id' : url.trim();
}

/// True when [toEmbedUrl] would rewrite this URL — drives the submit-form hint.
bool willConvert(String? url) {
  final trimmed = (url ?? '').trim();
  if (trimmed.isEmpty) return false;
  return toEmbedUrl(trimmed) != trimmed;
}

/// Which player, if any, can handle this URL.
VideoKind classifyVideoUrl(String? url) {
  if (url == null || url.trim().isEmpty) return VideoKind.none;
  final u = url.trim();
  if (isYouTube(u)) return VideoKind.youtube;
  if (RegExp(r'\.m3u8(\?|$)', caseSensitive: false).hasMatch(u)) return VideoKind.hls;
  if (RegExp(r'\.mp4(\?|$)', caseSensitive: false).hasMatch(u)) return VideoKind.mp4;
  if (RegExp('dynetube', caseSensitive: false).hasMatch(u)) return VideoKind.dynetube;
  return VideoKind.mp4; // unknown direct URL — let the native player try it
}

/// True when video_player/Chewie can decode this URL directly.
///
/// YouTube is the one source that cannot: it serves a web page, not a media
/// stream, so handing it to ExoPlayer/AVPlayer fails. Replaces the previous
/// `url.contains('youtube')` checks, which also matched any unrelated URL that
/// merely had the word in its path.
bool isNativePlayable(String? url) {
  final kind = classifyVideoUrl(url);
  return kind != VideoKind.youtube && kind != VideoKind.none;
}

/// Thumbnail derivable from the video URL, or null when the source exposes
/// none. `hqdefault` is used because it exists for every upload — `maxresdefault`
/// 404s for videos never published above 720p.
String? autoThumbnail(String? url) {
  final id = youTubeId(url);
  return id != null ? 'https://img.youtube.com/vi/$id/hqdefault.jpg' : null;
}

/// Human label for the detected source, shown next to a URL field.
String videoKindLabel(String? url) {
  switch (classifyVideoUrl(url)) {
    case VideoKind.youtube:
      return 'YouTube';
    case VideoKind.hls:
      return 'HLS stream';
    case VideoKind.dynetube:
      return 'DyneTube';
    case VideoKind.mp4:
      return 'Direct video';
    case VideoKind.none:
      return '';
  }
}
