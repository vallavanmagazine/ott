import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { VIDEO_DIR } from './supabase';

/** A resolved item to play: a program video or an ad clip. */
export interface PlayItem { file: string; kind: 'program' | 'ad' | 'filler'; }

/** Resolve a video_url to a local file under VIDEO_DIR (self-hosted only). */
export function resolveLocal(videoUrl?: string | null): string | null {
  if (!videoUrl) return null;
  if (/^https?:\/\//i.test(videoUrl)) return null; // remote — playout streams local files only
  const p = path.join(VIDEO_DIR, path.basename(videoUrl));
  return fs.existsSync(p) ? p : null;
}

/** Write an FFmpeg concat playlist file and return its path. */
export function writePlaylist(items: PlayItem[]): string {
  const lines = items
    .map((it) => resolveLocalOrNull(it.file))
    .filter((f): f is string => !!f)
    .map((f) => `file '${f.replace(/'/g, "'\\''")}'`);
  const file = path.join(os.tmpdir(), `vallavan_playlist_${Date.now()}.txt`);
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

function resolveLocalOrNull(file: string): string | null {
  if (path.isAbsolute(file) && fs.existsSync(file)) return file;
  return resolveLocal(file);
}
