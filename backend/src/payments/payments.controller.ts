import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InvoicesService } from './invoices.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService, private readonly invoices: InvoicesService) {}

  @Post('payments/create-link')
  createLink(@Body() body: any) {
    return this.payments.createLink(body);
  }

  @Post('payments/webhook')
  webhook(@Body() body: any) {
    return this.payments.handleWebhook(body);
  }

  @Get('invoices/:sponsorId')
  invoicesFor(@Param('sponsorId') sponsorId: string) {
    return this.invoices.list(sponsorId);
  }

  @Post('invoices')
  createInvoice(@Body() body: { sponsorId: string; amountPaise: number; type?: string; razorpayPaymentId?: string }) {
    return this.invoices.create(body);
  }
}
