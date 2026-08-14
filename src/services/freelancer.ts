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
