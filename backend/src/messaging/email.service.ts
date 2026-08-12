import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../common/settings.service';

/** Transactional email via Resend (Phase 16). Key server-side only. */
@Injectable()
export class EmailService {
  private log = new Logger('EmailService');
  constructor(private readonly settings: SettingsService) {}

  async send(to: string, subject: string, html: string, from = 'Vallavan <noreply@vallavan.in>') {
    const key = await this.settings.get('RESEND_API_KEY');
    if (!key) { this.log.warn(`[skip] RESEND_API_KEY not set — would email ${to}: ${subject}`); return { skipped: true }; }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
    return res.json();
  }

  welcome(to: string, name: string) {
    return this.send(to, 'Welcome to Vallavan', `<p>Vanakkam ${name},</p><p>Welcome to Vallavan — documentaries that matter.</p>`);
  }
  campaignApproved(to: string, name: string) {
    return this.send(to, 'Your campaign is live', `<p>Your campaign “${name}” has been approved and is now Active.</p>`);
  }
  receipt(to: string, amountRupees: number) {
    return this.send(to, 'Wallet top-up receipt', `<p>Your wallet was topped up by ₹${amountRupees.toLocaleString('en-IN')}.</p>`);
  }
}
