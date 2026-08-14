/**
 * Freelancer marketplace (Section C). Applications, tasks, assignments,
 * earnings. Writes gated by RLS (self-apply / admin) — see supabase/section_f.sql.
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';
import { formatDate } from '@/lib/transforms';

export const FREELANCER_ROLES = ['Reporter', 'Anchor', 'Writer', 'Visual Editor', 'Program Producer'];
export const ENROLLMENT_FEE_RUPEES = 1499;

export interface FreelancerApplicationInput {
  name: string; phone: string; email: string; district: string;
  roles: string[]; experienceYears: number; portfolioUrl?: string; showreelUrl?: string; resumeUrl?: string;
}

export async function applyFreelancer(input: FreelancerApplicationInput) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: userRes } = await supabase.auth.getUser();
  let userId: string | null = null;
  if (userRes.user?.email) {
    const u = await supabase.from('app_users').select('id').ilike('email', userRes.user.email).maybeSingle();
    userId = u.data?.id ?? null;
  }
  const { error } = await supabase.from('freelancers').insert({
    user_id: userId, name: input.name, phone: input.phone, email: input.email, district: input.district,
    roles: input.roles, experience_years: input.experienceYears, portfolio_url: input.portfolioUrl ?? null,
    showreel_url: input.showreelUrl ?? null, resume_url: input.resumeUrl ?? null, status: 'pending',
  });
  if (error) throw error;
}

export interface FreelancerTask {
  id: string; title: string; description: string; contentType: string; rolesNeeded: string[];
  payPerRole: Record<string, number>; deadline: string; location: string; status: string;
}

function rowToTask(r: any): FreelancerTask {
  return {
    id: r.id, title: r.title, description: r.description, contentType: r.content_type,
    rolesNeeded: r.roles_needed ?? [], payPerRole: r.pay_per_role ?? {},
    deadline: r.deadline ? formatDate(r.deadline) : '—', location: r.location ?? '—', status: r.status,
  };
}

export async function fetchOpenTasks(): Promise<FreelancerTask[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('freelancer_tasks').select('*').eq('status', 'open').order('created_at', { ascending: false });
  return (data ?? []).map(rowToTask);
}

export async function fetchMyFreelancer() {
  if (!supabase) return null;
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user?.email) return null;
  const { data } = await supabase.from('freelancers').select('*').ilike('email', userRes.user.email).maybeSingle();
  return data;
}

// --- Admin ---
export async function fetchApplications() {
  if (!supabase) return [];
  const { data } = await supabase.from('freelancers').select('*').order('joined_at', { ascending: false });
  return data ?? [];
}

export async function setFreelancerStatus(id: string, status: string, name?: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('freelancers').update({ status }).eq('id', id);
  if (error) throw error;
  await logAudit(`Freelancer ${name ?? id} → ${status}`);
}

export interface TaskInput {
  title: string; description: string; contentType: string; rolesNeeded: string[]; payPerRole: Record<string, number>; location?: string; deadline?: string;
}

export async function createTask(input: TaskInput) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('freelancer_tasks').insert({
    title: input.title, description: input.description, content_type: input.contentType,
    roles_needed: input.rolesNeeded, pay_per_role: input.payPerRole, location: input.location ?? null,
    deadline: input.deadline ?? null, status: 'open',
  });
  if (error) throw error;
  await logAudit(`Created freelancer task "${input.title}"`);
}

// ---------------------------------------------------------------------------
// Section C3–C6: assignments, content submission, earnings, magazine, ad sales
// ---------------------------------------------------------------------------
export const MAGAZINE_COST_RUPEES = 14;   // reseller buy price
export const MAGAZINE_SELL_RUPEES = 20;   // MRP
export const AD_SALES_COMMISSION = 0.20;  // 20%

/** Resolve the current user's freelancer id (or null). */
async function currentFreelancerId(): Promise<string | null> {
  const f = await fetchMyFreelancer();
  return f?.id ?? null;
}

export interface FreelancerAssignment {
  id: string; taskId: string; taskTitle: string; role: string; status: string;
  contentUrl: string | null; payRupees: number; date: string;
}

/** Assignments belonging to the current freelancer. */
export async function fetchMyAssignments(): Promise<FreelancerAssignment[]> {
  if (!supabase) return [];
  const fid = await currentFreelancerId();
  if (!fid) return [];
  const { data } = await supabase
    .from('task_assignments')
    .select('*, freelancer_tasks(title)')
    .eq('freelancer_id', fid)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id, taskId: r.task_id, taskTitle: r.freelancer_tasks?.title ?? 'Task',
    role: r.role, status: r.status, contentUrl: r.content_url ?? null,
    payRupees: Math.round((r.payment_amount_paise ?? 0) / 100),
    date: r.created_at ? formatDate(r.created_at) : '—',
  }));
}

/** Submit finished content for an assignment → status 'submitted'. */
export async function submitTaskContent(assignmentId: string, contentUrl: string, notes?: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('task_assignments').update({
    content_url: contentUrl, notes: notes ?? null, status: 'submitted', submitted_at: new Date().toISOString(),
  }).eq('id', assignmentId);
  if (error) throw error;
  await logAudit('Freelancer submitted task content');
}

export interface EarningRow { id: string; type: string; amountRupees: number; description: string; status: string; date: string; }

export async function fetchMyEarnings(): Promise<{ rows: EarningRow[]; totalRupees: number; pendingRupees: number }> {
  const empty = { rows: [], totalRupees: 0, pendingRupees: 0 };
  if (!supabase) return empty;
  const fid = await currentFreelancerId();
  if (!fid) return empty;
  const { data } = await supabase
    .from('freelancer_earnings').select('*').eq('freelancer_id', fid).order('created_at', { ascending: false });
  const rows: EarningRow[] = (data ?? []).map((r: any) => ({
    id: r.id, type: r.type, amountRupees: Math.round((r.amount_paise ?? 0) / 100),
    description: r.description ?? '', status: r.status, date: r.created_at ? formatDate(r.created_at) : '—',
  }));
  const totalRupees = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amountRupees, 0);
  const pendingRupees = rows.filter((r) => r.status !== 'paid').reduce((s, r) => s + r.amountRupees, 0);
  return { rows, totalRupees, pendingRupees };
}

export interface MagazineOrderRow { id: string; quantity: number; totalRupees: number; potentialProfitRupees: number; status: string; date: string; }

/** Order magazine copies for resale (₹14 each; sell at ₹20). */
export async function createMagazineOrder(quantity: number) {
  if (!supabase) throw new Error('Supabase not configured');
  const fid = await currentFreelancerId();
  if (!fid) throw new Error('Approved freelancer profile required.');
  const total = quantity * MAGAZINE_COST_RUPEES;
  const { error } = await supabase.from('magazine_orders').insert({
    freelancer_id: fid, quantity, unit_price_paise: MAGAZINE_COST_RUPEES * 100, total_paise: total * 100, status: 'ordered',
  });
  if (error) throw error;
  await logAudit(`Freelancer ordered ${quantity} magazines (₹${total})`);
}

export async function fetchMagazineOrders(): Promise<MagazineOrderRow[]> {
  if (!supabase) return [];
  const fid = await currentFreelancerId();
  if (!fid) return [];
  const { data } = await supabase.from('magazine_orders').select('*').eq('freelancer_id', fid).order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id, quantity: r.quantity, totalRupees: Math.round((r.total_paise ?? 0) / 100),
    potentialProfitRupees: r.quantity * (MAGAZINE_SELL_RUPEES - MAGAZINE_COST_RUPEES),
    status: r.status, date: r.created_at ? formatDate(r.created_at) : '—',
  }));
}

export interface AdSaleRow { id: string; businessName: string; saleRupees: number; commissionRupees: number; status: string; date: string; }

/** Log an ad sale by a freelancer; commission is 20% of the sale. */
export async function logAdSale(businessName: string, saleRupees: number) {
  if (!supabase) throw new Error('Supabase not configured');
  const fid = await currentFreelancerId();
  if (!fid) throw new Error('Approved freelancer profile required.');
  const commission = Math.round(saleRupees * AD_SALES_COMMISSION);
  const { error } = await supabase.from('ad_sales_log').insert({
    freelancer_id: fid, business_name: businessName, sale_amount_paise: saleRupees * 100,
    commission_paise: commission * 100, commission_rate: AD_SALES_COMMISSION, status: 'pending',
  });
  if (error) throw error;
  await logAudit(`Ad sale logged: ${businessName} ₹${saleRupees} (₹${commission} commission)`);
}

export async function fetchAdSales(): Promise<AdSaleRow[]> {
  if (!supabase) return [];
  const fid = await currentFreelancerId();
  if (!fid) return [];
  const { data } = await supabase.from('ad_sales_log').select('*').eq('freelancer_id', fid).order('created_at', { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id, businessName: r.business_name, saleRupees: Math.round((r.sale_amount_paise ?? 0) / 100),
    commissionRupees: Math.round((r.commission_paise ?? 0) / 100), status: r.status, date: r.created_at ? formatDate(r.created_at) : '—',
  }));
}
