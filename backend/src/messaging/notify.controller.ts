import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { SupabaseService } from '../common/supabase.service';

/**
 * Post-registration + transactional + broadcast email (Resend). Every handler
 * is best-effort: it never throws back to the caller, so email problems can't
 * break registration, payments, or the admin UI. No-ops when RESEND_API_KEY
 * is unset (EmailService logs a skip).
 */
@Controller('notify')
export class NotifyController {
  constructor(private readonly email: EmailService, private readonly supa: SupabaseService) {}

  @Post('welcome')
  async welcome(@Body() b: { email: string; name: string; role?: string }) {
    try { await this.email.welcome(b.email, b.name || 'there', b.role ?? 'member'); return { ok: true }; }
    catch { return { ok: false }; }
  }

  @Post('invoice')
  async invoice(@Body() b: { email: string; name: string; invoiceNumber: string; amountRupees: number; gstRupees: number; totalRupees: number; type?: string }) {
    try { await this.email.invoice(b.email, b.name || 'there', b); return { ok: true }; }
    catch { return { ok: false }; }
  }

  /** Generic transactional dispatch keyed by `kind`. */
  @Post('transactional')
  async transactional(@Body() b: { email: string; name?: string; kind: string; data?: any }) {
    const name = b.name || 'there';
    try {
      switch (b.kind) {
        case 'welcome': await this.email.welcome(b.email, name, b.data?.role); break;
        case 'campaign_approved': await this.email.campaignApproved(b.email, b.data?.campaign ?? 'your campaign'); break;
        case 'topup_receipt': await this.email.otpReceipt(b.email, Number(b.data?.amountRupees ?? 0)); break;
        case 'task_assigned': await this.email.taskAssigned(b.email, name, b.data?.task ?? 'a task'); break;
        case 'payout': await this.email.payout(b.email, name, Number(b.data?.amountRupees ?? 0)); break;
        default: return { ok: false, error: 'unknown kind' };
      }
      return { ok: true };
    } catch { return { ok: false }; }
  }

  /**
   * Newsletter / promotional broadcast. `audience` is 'sponsors' | 'freelancers'
   * | 'all' | an explicit list of emails. Recipients from app_users respect the
   * email_opt_out flag. Returns how many were sent.
   */
  @Post('broadcast')
  async broadcast(@Body() b: {
    audience: 'sponsors' | 'freelancers' | 'all' | string[];
    category: 'newsletter' | 'promotional';
    subject: string;
    html: string;
    unsubscribeBase?: string;
  }) {
    if (!b.subject?.trim() || !b.html?.trim()) return { ok: false, error: 'subject and html required' };

    let recipients: string[] = [];
    if (Array.isArray(b.audience)) {
      recipients = b.audience;
    } else {
      let q = this.supa.client.from('app_users').select('email, role, email_opt_out').eq('email_opt_out', false);
      if (b.audience === 'sponsors') q = q.ilike('role', 'sponsor');
      else if (b.audience === 'freelancers') q = q.ilike('role', 'freelancer');
      const { data } = await q;
      recipients = (data ?? []).map((r: any) => r.email).filter(Boolean);
    }
    recipients = Array.from(new Set(recipients.map((e) => e.trim().toLowerCase()))).filter((e) => e.includes('@'));

    let sent = 0;
    for (const to of recipients) {
      const unsub = b.unsubscribeBase ? `${b.unsubscribeBase}?email=${encodeURIComponent(to)}` : undefined;
      try {
        if (b.category === 'promotional') await this.email.promotional(to, b.subject, b.html, unsub);
        else await this.email.newsletter(to, b.subject, b.html, unsub);
        sent++;
      } catch { /* skip failed recipient, keep going */ }
    }
    return { ok: true, recipients: recipients.length, sent };
  }
}
