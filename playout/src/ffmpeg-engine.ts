import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { HLS_OUTPUT_DIR } from './supabase';

/**
 * Wraps a long-running FFmpeg process that emits HLS from a concat playlist.
 *   ffmpeg -re -f concat -safe 0 -i playlist.txt -c:v libx264 -preset veryfast
 *          -c:a aac -f hls -hls_time 4 -hls_list_size 10
 *          -hls_flags delete_segments  /var/www/live/stream.m3u8
 */
export class FfmpegEngine {
  private proc: ChildProcess | null = null;
  private currentPlaylist = '';

  get running() { return this.proc !== null && !this.proc.killed; }
  get playlist() { return this.currentPlaylist; }

  start(playlistPath: string) {
    this.stop();
    this.currentPlaylist = playlistPath;
    const out = path.join(HLS_OUTPUT_DIR, 'stream.m3u8');
    const args = [
      '-re', '-f', 'concat', '-safe', '0', '-i', playlistPath,
      '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac',
      '-f', 'hls', '-hls_time', '4', '-hls_list_size', '10',
      '-hls_flags', 'delete_segments', out,
    ];
    this.proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
    this.proc.on('exit', (code) => { console.warn(`[ffmpeg] exited ${code}`); this.proc = null; });
    console.log('[ffmpeg] started →', out);
  }

  stop() {
    if (this.proc && !this.proc.killed) { this.proc.kill('SIGTERM'); }
    this.proc = null;
  }
}
