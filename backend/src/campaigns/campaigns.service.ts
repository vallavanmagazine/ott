import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../common/supabase.service';

/** Server-authoritative campaign lifecycle. Draft → Pending → Active → Paused/Ended. */
@Injectable()
export class CampaignsService {
  constructor(private readonly supa: SupabaseService) {}

  private async setStatus(id: string, status: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await this.supa.client
      .from('campaigns')
      .update({ status, ...extra })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  create(input: { sponsorId: string; name: string; budgetRupees: number; targetDistricts: string[] }) {
    return this.supa.client.from('campaigns').insert({
      sponsor_id: input.sponsorId,
      name: input.name,
      status: 'Draft',
      budget_paise: Math.round(input.budgetRupees * 100),
      target_districts: input.targetDistricts,
      start_date: new Date().toISOString().slice(0, 10),
    }).select().single().then(({ data, error }) => { if (error) throw error; return data; });
  }

  submit(id: string) { return this.setStatus(id, 'Pending Approval', { submitted_at: new Date().toISOString() }); }
  approve(id: string) { return this.setStatus(id, 'Active'); }
  reject(id: string) { return this.setStatus(id, 'Ended'); }
  pause(id: string) { return this.setStatus(id, 'Paused'); }
  resume(id: string) { return this.setStatus(id, 'Active'); }
}
