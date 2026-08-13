import { Injectable } from '@nestjs/common';
import { SettingsService } from '../common/settings.service';

/**
 * Server-side DyneTube operations (key from settings/env, never exposed to the
 * client). Docs: https://www.dyntube.com/dev. Endpoint/field names follow the
 * documented API; adjust if the live API differs.
 */
@Injectable()
export class DyneTubeService {
  constructor(private readonly settings: SettingsService) {}

  private async cfg() {
    const key = await this.settings.require('DYNETUBE_API_KEY');
    const base = (await this.settings.get('DYNETUBE_API_BASE')) || 'https://api.dyntube.com/v1';
    return { key, base };
  }

  private headers(key: string) {
    return { Authorization: `Bearer ${key}`, 'X-API-Key': key, 'Content-Type': 'application/json' };
  }

  async getVideo(id: string) {
    const { key, base } = await this.cfg();
    const res = await fetch(`${base}/videos/${id}`, { headers: this.headers(key) });
    if (!res.ok) throw new Error(`DyneTube get failed: ${res.status}`);
    return res.json();
  }

  async listVideos() {
    const { key, base } = await this.cfg();
    const res = await fetch(`${base}/videos`, { headers: this.headers(key) });
    if (!res.ok) throw new Error(`DyneTube list failed: ${res.status}`);
    return res.json();
  }

  async deleteVideo(id: string) {
    const { key, base } = await this.cfg();
    const res = await fetch(`${base}/videos/${id}`, { method: 'DELETE', headers: this.headers(key) });
    if (!res.ok) throw new Error(`DyneTube delete failed: ${res.status}`);
    return { ok: true };
  }

  /** Create a live stream (future playout). Returns stream key + HLS URL. */
  async createLiveStream(name: string) {
    const { key, base } = await this.cfg();
    const res = await fetch(`${base}/live/streams`, { method: 'POST', headers: this.headers(key), body: JSON.stringify({ name }) });
    if (!res.ok) throw new Error(`DyneTube live create failed: ${res.status}`);
    return res.json();
  }
}
