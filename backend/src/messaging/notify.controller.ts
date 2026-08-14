import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

/** Post-registration notifications (Resend). Silently no-ops if key unset. */
@Controller('notify')
export class NotifyController {
  constructor(private readonly email: EmailService) {}

  @Post('welcome')
  async welcome(@Body() body: { email: string; name: string }) {
    try {
      await this.email.welcome(body.email, body.name || 'there');
      return { ok: true };
    } catch {
      // Never fail registration because a welcome email didn't send.
      return { ok: false };
    }
  }
}
