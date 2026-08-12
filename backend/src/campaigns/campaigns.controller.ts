import { Body, Controller, Param, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Post()
  create(@Body() body: { sponsorId: string; name: string; budgetRupees: number; targetDistricts: string[] }) {
    return this.campaigns.create(body);
  }

  @Post(':id/submit') submit(@Param('id') id: string) { return this.campaigns.submit(id); }
  @Post(':id/approve') approve(@Param('id') id: string) { return this.campaigns.approve(id); }
  @Post(':id/reject') reject(@Param('id') id: string) { return this.campaigns.reject(id); }
  @Post(':id/pause') pause(@Param('id') id: string) { return this.campaigns.pause(id); }
  @Post(':id/resume') resume(@Param('id') id: string) { return this.campaigns.resume(id); }
}
