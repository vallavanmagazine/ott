import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../common/settings.service';

/** Firebase Cloud Messaging push notifications (Phase 18). Server key server-side. */
@Injectable()
export class PushService {
  private log = new Logger('PushService');
  constructor(private readonly settings: SettingsService) {}

  async send(deviceToken: string, title: string, body: string) {
    const serverKey = await this.settings.get('FIREBASE_SERVER_KEY');
    if (!serverKey) {
      this.log.warn(`[skip] FIREBASE_SERVER_KEY not set — would push "${title}"`);
      return { skipped: true };
    }
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: deviceToken, notification: { title, body } }),
    });
    if (!res.ok) throw new Error(`FCM failed: ${res.status}`);
    return res.json();
  }
}
