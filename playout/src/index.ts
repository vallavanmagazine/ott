/**
 * Vallavan 24/7 playout entry point.
 * Starts: the scheduler loop (drives FFmpeg HLS from the live schedule),
 * the RSS fetcher (ticker auto-population), and the upload server.
 *
 * SCAFFOLD: build the code here; run on the VPS after migration. Requires
 * FFmpeg installed (see Dockerfile). Do NOT start in the dev/build session.
 */
import { startScheduler } from './scheduler';
import { startRssFetcher } from './rss-fetcher';
import { startUploadServer } from './upload-server';
import { startHealthCheck } from './health-check';

async function main() {
  console.log('[playout] starting…');
  const engine = startScheduler();
  startHealthCheck(engine);
  startRssFetcher();
  startUploadServer();
  console.log('[playout] running. HLS → ' + (process.env.HLS_OUTPUT_DIR ?? '/var/www/live') + '/stream.m3u8');
}

main().catch((e) => { console.error('[playout] fatal', e); process.exit(1); });
