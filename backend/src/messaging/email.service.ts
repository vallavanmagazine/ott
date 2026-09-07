import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../common/settings.service';

const FROM = 'Vallavan <noreply@vallavan.in>';
const BRAND = '#D32F2F';

/** Wrap body HTML in a simple branded shell. `unsubscribe` adds a footer link. */
function shell(title: string, body: string, opts?: { unsubscribe?: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Segoe UI,Arial,sans-serif;color:#18181b">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:${BRAND};border-radius:14px 14px 0 0;padding:18px 24px">
      <span style="color:#fff;font-weight:900;letter-spacing:1px;font-size:18px">VALLAVAN</span>
      <div style="color:#ffd9d9;font-size:10px;letter-spacing:2px">DOCUMENTARIES THAT MATTER</div>
    </div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="color:#a1a1aa;font-size:11px;text-align:center;margin-top:16px">
      © ${new Date().getFullYear()} Vallavan · Tamil-first documentary OTT
      ${opts?.unsubscribe ? `<br/><a href="${opts.unsubscribe}" style="color:#a1a1aa">Unsubscribe</a>` : ''}
    </p>
  </div></body></html>`;
}

const inr = (rupees: number) => `₹${rupees.toLocaleString('en-IN')}`;

/**
 * Transactional + marketing email via Resend (key server-side only). Every
 * template funnels through `send()`, which no-ops (logs) when RESEND_API_KEY is
 * not configured — so callers never fail because email isn't set up yet.
 */
@Injectable()
export class EmailService {
  private log = new Logger('EmailService');
  constructor(private readonly settings: SettingsService) {}

  async send(to: string, subject: string, html: string, from = FROM) {
    const key = await this.settings.get('RESEND_API_KEY');
    if (!key) { this.log.warn(`[skip] RESEND_API_KEY not set — would email ${to}: ${subject}`); return { skipped: true }; }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`);
    return res.json();
  }

  // ---- Transactional ------------------------------------------------------
  welcome(to: string, name: string, role = 'member') {
    const roleLine = role.toLowerCase() === 'sponsor'
      ? 'Your sponsor account is ready. Top up your wallet and launch district-targeted campaigns from the app.'
      : role.toLowerCase() === 'freelancer'
        ? 'Your freelancer application is in. Once approved, pick up tasks and track earnings from the app.'
        : 'Welcome aboard — documentaries that matter.';
    return this.send(to, 'Welcome to Vallavan', shell(`Vanakkam ${name} 🙏`, `<p>${roleLine}</p>`));
  }

  campaignApproved(to: string, name: string) {
    return this.send(to, 'Your campaign is live', shell('Campaign approved ✅', `<p>Your campaign “${name}” has been approved and is now <b>Active</b>.</p>`));
  }

  otpReceipt(to: string, amountRupees: number) {
    return this.send(to, 'Wallet top-up receipt', shell('Wallet topped up', `<p>Your wallet was credited <b>${inr(amountRupees)}</b>. Thank you.</p>`));
  }

  taskAssigned(to: string, name: string, task: string) {
    return this.send(to, 'New task assigned', shell(`Hi ${name}`, `<p>You've been assigned: <b>${task}</b>. Open the app to view details and submit your work.</p>`));
  }

  payout(to: string, name: string, amountRupees: number) {
    return this.send(to, 'Payout processed', shell(`Hi ${name}`, `<p>A payout of <b>${inr(amountRupees)}</b> has been processed to your account.</p>`));
  }

  // ---- Invoice ------------------------------------------------------------
  invoice(to: string, name: string, inv: { invoiceNumber: string; amountRupees: number; gstRupees: number; totalRupees: number; type?: string }) {
    const body = `
      <p>Hi ${name}, here is your invoice.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">
        <tr><td style="padding:6px 0;color:#71717a">Invoice #</td><td style="text-align:right"><b>${inv.invoiceNumber}</b></td></tr>
        <tr><td style="padding:6px 0;color:#71717a">Type</td><td style="text-align:right">${(inv.type ?? 'wallet_topup').replace(/_/g, ' ')}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a">Amount</td><td style="text-align:right">${inr(inv.amountRupees)}</td></tr>
        <tr><td style="padding:6px 0;color:#71717a">GST (18%)</td><td style="text-align:right">${inr(inv.gstRupees)}</td></tr>
        <tr><td style="padding:10px 0;border-top:1px solid #e4e4e7;font-weight:900">Total</td><td style="text-align:right;border-top:1px solid #e4e4e7;font-weight:900">${inr(inv.totalRupees)}</td></tr>
      </table>`;
    return this.send(to, `Invoice ${inv.invoiceNumber} — Vallavan`, shell('Tax Invoice', body));
  }

  // ---- Newsletter / Promotional (consent-gated by caller) ------------------
  newsletter(to: string, subject: string, bodyHtml: string, unsubscribe?: string) {
    return this.send(to, subject, shell(subject, bodyHtml, { unsubscribe }));
  }

  promotional(to: string, subject: string, bodyHtml: string, unsubscribe?: string) {
    return this.send(to, subject, shell(subject, bodyHtml, { unsubscribe }));
  }
}
