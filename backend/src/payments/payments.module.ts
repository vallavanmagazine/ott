import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InvoicesService } from './invoices.service';

@Module({ providers: [PaymentsService, InvoicesService], controllers: [PaymentsController], exports: [PaymentsService, InvoicesService] })
export class PaymentsModule {}
