import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { SettingsService } from '../common/settings.service';
import { SupabaseService } from '../common/supabase.service';

/**
 * Server-side Bunny Stream operations. Docs: https://docs.bunny.net/reference/api-overview
 *
 * Runs alongside DyneTubeService, which is untouched — existing content keeps
 * resolving through DyneTube. Only uploads started via /api/bunny/upload-init
 * ever produce a Bunny asset, and only confirm() marks a row as 'bunny'.
 *
 * SECURITY: BUNNY_STREAM_API_KEY is read here and never returned to a caller or
 * written to a log. The browser never receives it — it receives a short-lived
 * TUS signature instead (see getUploadSignature), which grants upload rights to
 * exactly one video GUID until it expires. This is deliberately the opposite of
 * the DyneTube path, where VITE_DYNETUBE_API_KEY ships inside the client bundle.
 */

/** Bunny's numeric video states, from the Video object's `status` field. */
export type BunnyStatus =
  | 'created' | 'uploaded' | 'processing' | 'transcoding'
  | 'finished' | 'error' | 'upload_failed' | 'unknown';

const STATUS_BY_CODE: Record<number, BunnyStatus> = {
  0: 'created',
  1: 'uploaded',
  2: 'processing',
  3: 'transcoding',
  4: 'finished',
  5: 'error',
  6: 'upload_failed',
};

export interface BunnyVideoStatus {
  guid: string;
  status: BunnyStatus;
  /** True only when Bunny has finished transcoding and the HLS manifest exists. */
  ready: boolean;
  thumbnailUrl: string | null;
  playbackUrl: string | null;
}

/**
 * The only tables confirm() may write, and the only values `table` may take.
 *
 * This is an allowlist rather than a validation regex on purpose: `table` comes
 * from the request body and is interpolated into supabase.from(), so anything
 * unlisted must be rejected outright rather than sanitised. It is exactly the
 * set of tables carrying video_url — keep it in step with
 * supabase/bunny_video_fields.sql.
 */
export const VIDEO_TABLES = ['documentaries', 'feed_reels', 'inspire_items', 'live_slots'] as const;
export type VideoTable = (typeof VIDEO_TABLES)[number];

export function assertVideoTable(value: unknown): VideoTable {
  if (typeof value !== 'string' || !(VIDEO_TABLES as readonly string[]).includes(value)) {
    throw new BadRequestException(`table must be one of: ${VIDEO_TABLES.join(', ')}`);
  }
  return value as VideoTable;
}

export interface UploadTicket {
  videoGuid: string;
  tusEndpoint: string;
  tusHeaders: Record<string, string>;
  /** Unix ms at which tusHeaders stop being accepted by Bunny. */
  expiry: number;
}

/** How long a TUS upload signature stays valid. Long enough for a large file. */
const SIGNATURE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BunnyService {
  constructor(
    private readonly settings: SettingsService,
    private readonly supa: SupabaseService,
  ) {}

  /**
   * Resolves config the same way DyneTubeService does — platform_settings first,
   * then process.env (see SettingsService).
   *
   * cdnHostname is the Stream library's pull-zone host (e.g. vz-xxxx.b-cdn.net).
   * It is NOT derivable from the library id, and it is what turns a GUID into a
   * playable .m3u8, so playbackUrl() refuses to guess when it is missing.
   */
  private async cfg() {
    const apiKey = await this.settings.require('BUNNY_STREAM_API_KEY');
    const libraryId = await this.settings.require('BUNNY_LIBRARY_ID');
    const cdnHostname = (await this.settings.get('BUNNY_CDN_HOSTNAME')) ?? '';
    const base = (await this.settings.get('BUNNY_STREAM_API_BASE')) || 'https://video.bunnycdn.com';
    return { apiKey, libraryId, cdnHostname, base };
  }

  private headers(apiKey: string) {
    return { AccessKey: apiKey, 'Content-Type': 'application/json', accept: 'application/json' };
  }

  /**
   * Error text that deliberately never interpolates the response body, because
   * Bunny echoes request headers on some 4xx responses and the key travels in one.
   */
  private fail(op: string, status: number): never {
    throw new Error(`Bunny ${op} failed: HTTP ${status}`);
  }

  /** HLS manifest URL for a GUID. Null when the pull-zone host is not configured. */
  private playbackUrl(cdnHostname: string, guid: string): string | null {
    return cdnHostname ? `https://${cdnHostname}/${guid}/playlist.m3u8` : null;
  }

  private thumbnailUrl(cdnHostname: string, guid: string, fileName?: string): string | null {
    if (!cdnHostname) return null;
    return `https://${cdnHostname}/${guid}/${fileName || 'thumbnail.jpg'}`;
  }

  /**
   * Create the video record on Bunny. This reserves the GUID; no bytes move yet —
   * the browser then uploads to it over TUS using getUploadSignature().
   */
  async createVideo(title: string): Promise<{ videoGuid: string }> {
    const { apiKey, libraryId, base } = await this.cfg();
    const res = await fetch(`${base}/library/${libraryId}/videos`, {
      method: 'POST',
      headers: this.headers(apiKey),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) this.fail('create video', res.status);
    const json = (await res.json()) as { guid?: string };
    if (!json.guid) throw new Error('Bunny create video: response contained no guid');
    return { videoGuid: json.guid };
  }

  /**
   * Build the TUS credentials the browser needs to upload straight to Bunny.
   *
   * Signature is sha256(libraryId + apiKey + expiry + videoGuid), per Bunny's TUS
   * spec. The expiry is a Unix timestamp in MILLISECONDS and is sent back
   * unchanged as AuthorizationExpire — the two must agree exactly or Bunny
   * rejects the upload, so both come from the same `expiry` value below.
   *
   * The api key is an input to the hash only; it is not part of the returned
   * object, so nothing here leaks it to the client.
   */
  async getUploadSignature(videoGuid: string): Promise<UploadTicket> {
    const { apiKey, libraryId, base } = await this.cfg();
    const expiry = Date.now() + SIGNATURE_TTL_MS;
    const signature = createHash('sha256')
      .update(`${libraryId}${apiKey}${expiry}${videoGuid}`)
      .digest('hex');

    return {
      videoGuid,
      tusEndpoint: `${base}/tusupload`,
      tusHeaders: {
        AuthorizationSignature: signature,
        AuthorizationExpire: String(expiry),
        VideoId: videoGuid,
        LibraryId: libraryId,
      },
      expiry,
    };
  }

  /** Current processing state, plus the URLs that only exist once ready. */
  async getVideoStatus(videoGuid: string): Promise<BunnyVideoStatus> {
    const { apiKey, libraryId, cdnHostname, base } = await this.cfg();
    const res = await fetch(`${base}/library/${libraryId}/videos/${videoGuid}`, {
      headers: this.headers(apiKey),
    });
    if (!res.ok) this.fail('get video', res.status);
    const json = (await res.json()) as { status?: number; thumbnailFileName?: string };

    const status = STATUS_BY_CODE[json.status ?? -1] ?? 'unknown';
    const ready = status === 'finished';

    return {
      guid: videoGuid,
      status,
      ready,
      // Only surface URLs once Bunny has actually produced them — handing back a
      // manifest URL mid-transcode would let confirm() save a 404 into video_url.
      thumbnailUrl: ready ? this.thumbnailUrl(cdnHostname, videoGuid, json.thumbnailFileName) : null,
      playbackUrl: ready ? this.playbackUrl(cdnHostname, videoGuid) : null,
    };
  }

  /**
   * Point a content row at a finished Bunny asset. This is the only place a row
   * ever becomes video_provider = 'bunny'.
   *
   * Refuses unless Bunny reports 'finished' AND a playback URL could actually be
   * built, so a half-transcoded asset or a missing BUNNY_CDN_HOSTNAME can never
   * overwrite a working video_url with something unplayable. Callers should poll
   * the status endpoint and only confirm once `ready` is true.
   */
  async confirmVideo(table: VideoTable, recordId: string, videoGuid: string) {
    const info = await this.getVideoStatus(videoGuid);

    if (!info.ready) {
      throw new BadRequestException(
        `Bunny video ${videoGuid} is not ready yet (status: ${info.status}) — confirm once it reports 'finished'.`,
      );
    }
    if (!info.playbackUrl) {
      throw new BadRequestException(
        'BUNNY_CDN_HOSTNAME is not configured, so no playback URL can be built. ' +
          'Set it to the Stream library pull-zone host (e.g. vz-xxxxxxxx.b-cdn.net) and retry.',
      );
    }

    const { data, error } = await this.supa.client
      .from(table)
      .update({
        video_url: info.playbackUrl,
        thumbnail_url: info.thumbnailUrl,
        video_provider: 'bunny',
        bunny_video_id: videoGuid,
      })
      .eq('id', recordId)
      .select('id')
      .maybeSingle();

    if (error) throw new Error(`Supabase update failed on ${table}: ${error.message}`);
    if (!data) throw new BadRequestException(`No row with id ${recordId} in ${table}`);

    return {
      ok: true as const,
      table,
      recordId,
      videoGuid,
      videoUrl: info.playbackUrl,
      thumbnailUrl: info.thumbnailUrl,
    };
  }

  async deleteVideo(videoGuid: string): Promise<{ ok: true }> {
    const { apiKey, libraryId, base } = await this.cfg();
    const res = await fetch(`${base}/library/${libraryId}/videos/${videoGuid}`, {
      method: 'DELETE',
      headers: this.headers(apiKey),
    });
    if (!res.ok) this.fail('delete video', res.status);
    return { ok: true };
  }
}
