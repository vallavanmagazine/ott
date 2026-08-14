import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { WhatsappService } from './whatsapp.service';
import { PushService } from './push.service';
import { MessagingController } from './messaging.controller';
import { NotifyController } from './notify.controller';

@Module({
  providers: [EmailService, SmsService, WhatsappService, PushService],
  controllers: [MessagingController, NotifyController],
  exports: [EmailService, SmsService, WhatsappService, PushService],
})
export class MessagingModule {}
