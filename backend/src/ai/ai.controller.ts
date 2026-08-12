import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('ad-creative')
  adCreative(@Body() body: { product: string; language?: string; tone?: string }) {
    return this.ai.adCreative(body.product, body.language, body.tone);
  }
}
