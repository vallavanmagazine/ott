/// Sharing content out of the app.
///
/// URLs point at seo-site (vallavan.in), NOT the app — the same rule the web
/// client follows in src/services/share.ts. seo-site server-renders per-item
/// OpenGraph tags, so a pasted link previews with a real title, description and
/// thumbnail; a link into the SPA would preview as the generic homepage because
/// its meta tags are identical on every route.
///
/// Deep links back into the app (App Links / Universal Links) are deliberately
/// out of scope for now, so a shared link opens in the browser.
library;

import 'package:share_plus/share_plus.dart';

import '../config/env.dart';

/// Content kinds and the seo-site route each maps to. Mirrors ShareKind in
/// src/services/share.ts — the two must agree or the clients emit different
/// URLs for the same row.
///
/// [reel] and [live] are the app's real navigation (Feed and Live TV) and use
/// slugs. [documentary] and [inspire] are legacy id-based routes, kept working
/// for links already in the wild but not extended.
enum ShareKind { documentary, reel, inspire, live }

const Map<ShareKind, String> _routes = {
  ShareKind.documentary: 'documentaries',
  ShareKind.reel: 'feed',
  ShareKind.inspire: 'inspire',
  ShareKind.live: 'live',
};

/// The slug when present, else the id.
///
/// seo-site resolves slug first and falls back to id, so a row that predates
/// supabase/feed_live_slugs.sql still shares a link that works.
String shareRefFor({String? slug, required String id}) {
  final s = (slug ?? '').trim();
  return s.isEmpty ? id : s;
}

/// Canonical public URL for a piece of content.
///
/// [ref] is a slug or an id — see [shareRefFor].
///
/// [Env.siteUrl] carries a trailing slash (it doubles as the Referer sent to
/// Bunny's CDN), so it is trimmed here rather than producing a double slash.
String shareUrlFor(ShareKind kind, String ref) {
  final base = Env.siteUrl.replaceAll(RegExp(r'/+$'), '');
  return '$base/${_routes[kind]}/$ref';
}

/// The message body. Same wording as the web client's contentShareLinks().
String shareMessageFor(String title, String url) => '$title — watch on Vallavan: $url';

/// Open the OS share sheet for a piece of content.
///
/// Uses `text` rather than `uri`: ShareParams documents that the two cannot be
/// combined, and text carries the title alongside the link on every platform,
/// where a bare uri would share a naked URL with no context. `subject` is used
/// by targets that have one, such as email.
Future<void> shareContent({
  required ShareKind kind,
  required String id,
  required String title,
  String? slug,
}) async {
  final url = shareUrlFor(kind, shareRefFor(slug: slug, id: id));
  await SharePlus.instance.share(
    ShareParams(text: shareMessageFor(title, url), subject: title),
  );
}
