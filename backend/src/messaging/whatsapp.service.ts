import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../common/settings.service';

/** WhatsApp Business notifications (Phase 17) via Meta Cloud API. Key server-side. */
@Injectable()
export class WhatsappService {
  private log = new Logger('WhatsappService');
  constructor(private readonly settings: SettingsService) {}

  async send(toPhone: string, body: string) {
    const token = await this.settings.get('WHATSAPP_API_KEY');
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
    if (!token || !phoneId) {
      this.log.warn(`[skip] WhatsApp not configured — would message ${toPhone}: ${body}`);
      return { skipped: true };
    }
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone.replace(/\D/g, ''),
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp failed: ${res.status}`);
    return res.json();
  }
}
