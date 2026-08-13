# Vallavan — Flutter Mobile App

Native Android/iOS app for the Vallavan Tamil documentary OTT platform. Shares
the same Supabase backend, theme, and data as the web app (`../project`).

## Run

Keys are injected at build/run time (never hard-coded):

```bash
flutter pub get
flutter run --dart-define=SUPABASE_ANON_KEY=<your-anon-key>
flutter build apk --release --dart-define=SUPABASE_ANON_KEY=<your-anon-key>
```

`SUPABASE_URL` defaults to the project URL; override with `--dart-define=SUPABASE_URL=...`.

## What's inside
- **Screens**: splash, home (auto-slide hero), feed (9:16 reels), explore, inspire,
  live TV (Coming Soon), inline 16:9 video player, detail, search, notifications,
  profile + settings/history/later/help/about, sponsor login/dashboard/create-campaign.
- **Ads**: geo-targeted pre/mid/post-roll + timer strip overlay + feed strip/banner
  (same cascade + rotation as web; tracked in `ad_events`).
- **State**: SharedPreferences (watch history/later, prefs, recent searches).
- **Video**: `video_player` + `chewie` (native HLS/MP4; YouTube opens externally).

## Notes / deviations (see also the web PROJECT_STATE)
- Omitted `hls_player` — `video_player` handles HLS natively (ExoPlayer/AVPlayer).
- Navigation uses Flutter's `Navigator` (go_router is a dependency but not the router).
- Admin panel, playout, and broadcast overlay are **web-only** by design (not in this app).
- Toolchain: Gradle 8.7, AGP 8.3.0, Kotlin 1.9.24 (stdlib pinned) for JDK-17 builds.

`flutter analyze` → clean. `flutter build apk --release` → `app-release.apk` (~24 MB).
