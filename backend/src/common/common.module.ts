import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { SettingsService } from './settings.service';

@Global()
@Module({
  providers: [SupabaseService, SettingsService],
  exports: [SupabaseService, SettingsService],
})
export class CommonModule {}
