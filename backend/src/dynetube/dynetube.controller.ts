import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { DyneTubeService } from './dynetube.service';

@Controller('dynetube')
export class DyneTubeController {
  constructor(private readonly dyne: DyneTubeService) {}

  @Get('videos') list() { return this.dyne.listVideos(); }
  @Get('videos/:id') get(@Param('id') id: string) { return this.dyne.getVideo(id); }
  @Delete('videos/:id') remove(@Param('id') id: string) { return this.dyne.deleteVideo(id); }
  @Post('live') live(@Body() body: { name: string }) { return this.dyne.createLiveStream(body.name); }
}
