import { Module } from '@nestjs/common';
import { DyneTubeService } from './dynetube.service';
import { DyneTubeController } from './dynetube.controller';

@Module({ providers: [DyneTubeService], controllers: [DyneTubeController], exports: [DyneTubeService] })
export class DyneTubeModule {}
