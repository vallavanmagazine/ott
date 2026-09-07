import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';
import { EmailService } from '../messaging/email.service';

/**
 * Invoice records (Section B3/D7). Creates an invoice row with a unique number
 * and GST (18%). PDF generation is stubbed (pdf_url null) — a real PDF service
 * (or a serverless renderer) fills pdf_url/work_order_url later.
 */
@Injectable()
export class InvoicesService {
  private log = new Logger('InvoicesService');
  constructor(private readonly supa: SupabaseService, private readonly email: EmailService) {}

  private invoiceNumber(): string {
    const d = new Date();
    return `VLV-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 900000 + 100000)}`;
  }

  async create(input: { sponsorId: string; amountPaise: number; type?: string; razorpayPaymentId?: string }) {
    const gst = Math.round(input.amountPaise * 0.18);
    const total = input.amountPaise + gst;
    const { data, error } = await this.supa.client.from('invoices').insert({
      sponsor_id: input.sponsorId, invoice_number: this.invoiceNumber(), type: input.type ?? 'wallet_topup',
      amount_paise: input.amountPaise, gst_paise: gst, total_paise: total,
      razorpay_payment_id: input.razorpayPaymentId ?? null,
    }).select().single();
    if (error) throw error;

    // Best-effort invoice email to the sponsor (never blocks invoice creation).
    try {
      const { data: sponsor } = await this.supa.client
        .from('sponsors').select('name, owner_name, email').eq('id', input.sponsorId).maybeSingle();
      if (sponsor?.email) {
        await this.email.invoice(sponsor.email, sponsor.owner_name ?? sponsor.name ?? 'there', {
          invoiceNumber: data.invoice_number,
          amountRupees: Math.round(input.amountPaise / 100),
          gstRupees: Math.round(gst / 100),
          totalRupees: Math.round(total / 100),
          type: input.type ?? 'wallet_topup',
        });
      }
    } catch (e) { this.log.warn(`invoice email skipped: ${(e as Error).message}`); }

    return data;
  }

  async list(sponsorId?: string) {
    let q = this.supa.client.from('invoices').select('*').order('created_at', { ascending: false });
    if (sponsorId) q = q.eq('sponsor_id', sponsorId);
    const { data } = await q;
    return data ?? [];
  }
}
