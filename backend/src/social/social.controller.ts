import { Body, Controller, Post } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Post('publish')
  publish(@Body() body: { channel: 'facebook' | 'instagram'; headline: string; imageUrl?: string }) {
    return this.social.publish(body);
  }
}
