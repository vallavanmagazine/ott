/**
 * Inspire PR video ordering (Section B6). Sponsor buys a Spotlight/Prestige
 * package; payment is collected via a Razorpay payment link (test mode). The
 * order row tracks production status. Packages come from pricing.ts.
 */
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/transforms';
import { createPaymentLink } from '@/services/payments';
import { logAudit } from '@/services/admin-writes';

export interface InspireOrder {
  id: string;
  packageName: string;
  paidRupees: number;
  status: string;
  productionStatus: string;
  date: string;
}

/**
 * Create an inspire order and its payment link. Returns the link short URL so
 * the UI can present / share it. Nothing is "paid" until the link is completed.
 */
export async function createInspireOrder(input: {
  sponsorId: string;
  packageId: string;
  packageName: string;
  priceRupees: number;
}): Promise<{ orderId: string; shortUrl: string }> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase
    .from('inspire_orders')
    .insert({
      sponsor_id: input.sponsorId,
      package_id: input.packageId,
      paid_paise: Math.round(input.priceRupees * 100),
      status: 'ordered',
      production_status: 'pending',
    })
    .select('id')
    .single();
  if (error) throw error;

  const link = await createPaymentLink({
    sponsorId: input.sponsorId,
    amountRupees: input.priceRupees,
    purpose: `inspire_${input.packageName.toLowerCase()}`,
  });

  await logAudit(`Inspire order "${input.packageName}" (₹${input.priceRupees.toLocaleString('en-IN')}) created`);
  return { orderId: data.id as string, shortUrl: link.shortUrl };
}

export async function fetchMyInspireOrders(sponsorId: string): Promise<InspireOrder[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('inspire_orders')
    .select('*, inspire_packages(name)')
    .eq('sponsor_id', sponsorId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    packageName: r.inspire_packages?.name ?? 'PR Video',
    paidRupees: Math.round((r.paid_paise ?? 0) / 100),
    status: r.status,
    productionStatus: r.production_status,
    date: r.created_at ? formatDate(r.created_at) : '—',
  }));
}
