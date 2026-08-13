import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { WalletModule } from './wallet/wallet.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AiModule } from './ai/ai.module';
import { MessagingModule } from './messaging/messaging.module';
import { SocialModule } from './social/social.module';
import { DyneTubeModule } from './dynetube/dynetube.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    WalletModule,
    CampaignsModule,
    AiModule,
    MessagingModule,
    SocialModule,
    DyneTubeModule,
  ],
})
export class AppModule {}
