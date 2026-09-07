import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

/** OTP endpoints (Phase 15). Sponsor phone-login flow. */
@Controller('otp')
export class MessagingController {
  constructor(private readonly sms: SmsService) {}

  @Post('send')
  send(@Body() body: { phone: string }) {
    return this.sms.sendOtp(body.phone);
  }

  @Post('verify')
  async verify(@Body() body: { phone: string; code: string }) {
    const ok = await this.sms.verifyOtp(body.phone, body.code);
    return { ok };
  }

  @Post('send-email')
  sendEmail(@Body() body: { email: string }) {
    return this.sms.sendEmailOtp(body.email);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; code: string }) {
    const ok = await this.sms.verifyEmailOtp(body.email, body.code);
    return { ok };
  }
}
