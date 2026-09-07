import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InvoicesService } from './invoices.service';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [MessagingModule],
  providers: [PaymentsService, InvoicesService],
  controllers: [PaymentsController],
  exports: [PaymentsService, InvoicesService],
})
export class PaymentsModule {}
