# Vallavan Playout (24/7 broadcast)

Standalone Node + FFmpeg service that turns the `live_slots` schedule into a
continuous HLS stream, inserts ad breaks, auto-fills gaps, fetches RSS into the
ticker, and accepts admin video uploads.

## Pieces
- `scheduler.ts` — every minute, determines what should play now, builds a concat playlist, (re)starts FFmpeg.
- `ffmpeg-engine.ts` — the `-f hls` process → `/var/www/live/stream.m3u8`.
- `playlist-builder.ts` — concat file from local videos (self-hosted only).
- `ad-inserter.ts` — between-program ad clips from Active campaigns.
- `schedule-adjuster.ts` — drift when a program runs long/short.
- `filler.ts` — best-of promo loop when nothing is scheduled.
- `rss-fetcher.ts` — every 15 min, RSS → `ticker_items` (source='rss', 24h expiry, deduped).
- `upload-server.ts` — `POST /upload` (multipart) → saves under `/data/videos`, returns filename for `video_url`.
- `health-check.ts` — restarts FFmpeg if it dies.

## Run (on the VPS, after migration — NOT in the dev session)
```bash
cd playout
cp .env.example .env   # SUPABASE_SERVICE_ROLE_KEY, dirs
npm install
npm run build && npm start
# or: docker build -t vallavan-playout . && docker run --rm \
#     -v /var/www/live:/var/www/live -v /data/videos:/data/videos vallavan-playout
```

The frontend LiveScreen plays `https://<host>/live/stream.m3u8` when present, else
falls back to scheduled-video playback with the broadcast overlay on top.

## Status
Scaffold — real, coherent code; **not started in this session** (requires FFmpeg
+ a server). No deployment performed.
