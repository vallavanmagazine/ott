import 'package:flutter_test/flutter_test.dart';
import 'package:vallavan_app/utils/video.dart';

/// The Flutter and web clients read and write the same Supabase `video_url`
/// columns, so these cases mirror the web app's own suite for lib/video.ts.
/// If one side's accepted URL shapes drift from the other's, a row saved by one
/// client stops playing in the other — these tests are what pins them together.
void main() {
  const id = 'dQw4w9WgXcQ';
  const embed = 'https://www.youtube.com/embed/$id';

  group('youTubeId — every shape the CMS accepts', () {
    final shapes = <String, String>{
      'watch': 'https://www.youtube.com/watch?v=$id',
      'watch with trailing param': 'https://www.youtube.com/watch?v=$id&t=42s',
      'watch with leading param': 'https://www.youtube.com/watch?app=desktop&v=$id',
      'youtu.be': 'https://youtu.be/$id',
      'youtu.be with ?si=': 'https://youtu.be/$id?si=AbCdEfGh',
      'shorts': 'https://www.youtube.com/shorts/$id',
      'shorts with param': 'https://www.youtube.com/shorts/$id?feature=share',
      'live': 'https://www.youtube.com/live/$id',
      'legacy /v/': 'https://www.youtube.com/v/$id',
      'embed': embed,
      'nocookie embed': 'https://www.youtube-nocookie.com/embed/$id',
      'm. subdomain': 'https://m.youtube.com/watch?v=$id',
      'music. subdomain': 'https://music.youtube.com/watch?v=$id',
      'no protocol': 'youtube.com/watch?v=$id',
      'no protocol shorts': 'youtu.be/$id',
    };
    shapes.forEach((label, url) {
      test(label, () => expect(youTubeId(url), id, reason: url));
    });
  });

  group('youTubeId — rejects non-YouTube', () {
    for (final url in [
      'https://cdn.vallavan.tv/stream/master.m3u8',
      'https://cdn.vallavan.tv/clips/promo.mp4',
      'https://dynetube.com/v/abc123',
      'https://vimeo.com/123456789',
      '',
    ]) {
      test('null for "$url"', () => expect(youTubeId(url), isNull));
    }
    test('null for null', () => expect(youTubeId(null), isNull));
  });

  group('toEmbedUrl — canonical storage form', () {
    test('watch converts', () => expect(toEmbedUrl('https://www.youtube.com/watch?v=$id'), embed));
    test('shorts converts — the shape that used to fall through', () =>
        expect(toEmbedUrl('https://www.youtube.com/shorts/$id'), embed));
    test('youtu.be converts', () => expect(toEmbedUrl('https://youtu.be/$id?si=xY'), embed));
    test('live converts', () => expect(toEmbedUrl('https://www.youtube.com/live/$id'), embed));
    test('idempotent — embed converts to itself', () => expect(toEmbedUrl(embed), embed));
    test('double application is stable', () => expect(toEmbedUrl(toEmbedUrl('https://youtu.be/$id')), embed));

    test('HLS passes through untouched', () {
      const u = 'https://cdn.vallavan.tv/live/master.m3u8';
      expect(toEmbedUrl(u), u);
    });
    test('MP4 passes through untouched', () {
      const u = 'https://cdn.vallavan.tv/clips/promo.mp4';
      expect(toEmbedUrl(u), u);
    });
    test('DyneTube passes through untouched', () {
      const u = 'https://dynetube.com/v/abc123';
      expect(toEmbedUrl(u), u);
    });

    test('trims surrounding whitespace', () => expect(toEmbedUrl('  https://youtu.be/$id  '), embed));
    test('null for null', () => expect(toEmbedUrl(null), isNull));
    test('null for blank', () => expect(toEmbedUrl('   '), isNull));
  });

  group('toWatchUrl — the form the YouTube app intercepts', () {
    const watch = 'https://www.youtube.com/watch?v=$id';
    test('embed becomes watch', () => expect(toWatchUrl(embed), watch));
    test('shorts becomes watch', () => expect(toWatchUrl('https://www.youtube.com/shorts/$id'), watch));
    test('live becomes watch', () => expect(toWatchUrl('https://www.youtube.com/live/$id'), watch));
    test('youtu.be becomes watch', () => expect(toWatchUrl('https://youtu.be/$id'), watch));
    test('watch is idempotent', () => expect(toWatchUrl(watch), watch));
    test('non-YouTube passes through', () {
      const u = 'https://cdn.vallavan.tv/clips/promo.mp4';
      expect(toWatchUrl(u), u);
    });
  });

  group('classifyVideoUrl / isNativePlayable', () {
    test('YouTube is not natively playable', () {
      expect(classifyVideoUrl('https://www.youtube.com/shorts/$id'), VideoKind.youtube);
      expect(isNativePlayable('https://www.youtube.com/shorts/$id'), isFalse);
      expect(isNativePlayable(embed), isFalse);
    });
    test('HLS and MP4 are natively playable', () {
      expect(classifyVideoUrl('https://cdn.vallavan.tv/live/master.m3u8'), VideoKind.hls);
      expect(classifyVideoUrl('https://cdn.vallavan.tv/clips/promo.mp4'), VideoKind.mp4);
      expect(isNativePlayable('https://cdn.vallavan.tv/live/master.m3u8'), isTrue);
      expect(isNativePlayable('https://cdn.vallavan.tv/clips/promo.mp4'), isTrue);
    });
    test('HLS with a query string still classifies as HLS', () {
      expect(classifyVideoUrl('https://cdn.vallavan.tv/live/master.m3u8?token=abc'), VideoKind.hls);
    });
    test('empty and null are none, and not playable', () {
      expect(classifyVideoUrl(null), VideoKind.none);
      expect(classifyVideoUrl(''), VideoKind.none);
      expect(isNativePlayable(null), isFalse);
      expect(isNativePlayable(''), isFalse);
    });
    test('a path merely containing "youtube" is not treated as YouTube — '
        'the old contains() check got this wrong', () {
      const u = 'https://cdn.vallavan.tv/youtube-rips/promo.mp4';
      expect(classifyVideoUrl(u), VideoKind.mp4);
      expect(isNativePlayable(u), isTrue);
    });
  });

  group('autoThumbnail / willConvert', () {
    test('derives hqdefault from any YouTube shape', () {
      expect(autoThumbnail('https://www.youtube.com/shorts/$id'),
          'https://img.youtube.com/vi/$id/hqdefault.jpg');
    });
    test('null for non-YouTube', () => expect(autoThumbnail('https://x.tv/a.mp4'), isNull));
    test('willConvert true only when a rewrite happens', () {
      expect(willConvert('https://www.youtube.com/shorts/$id'), isTrue);
      expect(willConvert(embed), isFalse);
      expect(willConvert('https://x.tv/a.mp4'), isFalse);
      expect(willConvert(''), isFalse);
      expect(willConvert(null), isFalse);
    });
  });
}
