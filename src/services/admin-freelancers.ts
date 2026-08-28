/**
 * Admin side of the freelancer marketplace: applications, the active roster,
 * task creation/assignment, content review and payment release.
 *
 * The money path is deliberately two-step. Approving submitted content creates
 * a PENDING `freelancer_earnings` row; releasing payment flips that row to
 * paid and bumps the freelancer's lifetime total. That keeps "work accepted"
 * and "money sent" as separate, separately auditable decisions.
 */
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';
import { formatDate } from '@/lib/transforms';

function client() {
  if (!supabase) throw new Error('Supabase is not configured (.env missing).');
  return supabase;
}

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------
export interface AdminFreelancerRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  roles: string[];
  experienceYears: number;
  portfolioUrl: string;
  showreelUrl: string;
  resumeUrl: string;
  status: string;
  subscriptionPaid: boolean;
  totalEarnedRupees: number;
  tasksCompleted: number;
  joined: string;
}

export async function fetchFreelancers(): Promise<AdminFreelancerRow[]> {
  if (!supabase) return [];
  const [people, assignments] = await Promise.all([
    supabase.from('freelancers').select('*').order('joined_at', { ascending: false }),
    supabase.from('task_assignments').select('freelancer_id, status'),
  ]);
  if (people.error || !people.data) return [];

  const completed: Record<string, number> = {};
  for (const a of (assignments.data ?? []) as any[]) {
    if (a.status === 'approved' || a.status === 'paid') {
      completed[a.freelancer_id] = (completed[a.freelancer_id] ?? 0) + 1;
    }
  }

  return (people.data as any[]).map((f) => ({
    id: f.id,
    name: f.name,
    phone: f.phone ?? '',
    email: f.email ?? '',
    district: f.district ?? '',
    roles: f.roles ?? [],
    experienceYears: f.experience_years ?? 0,
    portfolioUrl: f.portfolio_url ?? '',
    showreelUrl: f.showreel_url ?? '',
    resumeUrl: f.resume_url ?? '',
    status: f.status ?? 'pending',
    subscriptionPaid: f.subscription_paid === true,
    totalEarnedRupees: Number(f.total_earned_paise || 0) / 100,
    tasksCompleted: completed[f.id] ?? 0,
    joined: f.joined_at ? formatDate(f.joined_at) : '—',
  }));
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export interface AdminTaskRow {
  id: string;
  title: string;
  description: string;
  contentType: string;
  rolesNeeded: string[];
  payPerRole: Record<string, number>;
  deadline: string;
  deadlineIso: string;
  location: string;
  status: string;
  assignedCount: number;
  created: string;
}

export async function fetchTasks(): Promise<AdminTaskRow[]> {
  if (!supabase) return [];
  const [tasks, assignments] = await Promise.all([
    supabase.from('freelancer_tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('task_assignments').select('task_id'),
  ]);
  if (tasks.error || !tasks.data) return [];

  const counts: Record<string, number> = {};
  for (const a of (assignments.data ?? []) as any[]) {
    counts[a.task_id] = (counts[a.task_id] ?? 0) + 1;
  }

  return (tasks.data as any[]).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    contentType: t.content_type,
    rolesNeeded: t.roles_needed ?? [],
    payPerRole: t.pay_per_role ?? {},
    deadline: t.deadline ? formatDate(t.deadline) : '—',
    deadlineIso: t.deadline ? String(t.deadline).slice(0, 10) : '',
    location: t.location ?? '',
    status: t.status ?? 'open',
    assignedCount: counts[t.id] ?? 0,
    created: t.created_at ? formatDate(t.created_at) : '—',
  }));
}

export interface TaskUpsert {
  title: string;
  description: string;
  contentType: string;
  rolesNeeded: string[];
  /** role → rupees */
  payPerRole: Record<string, number>;
  deadline?: string;
  location?: string;
  status?: string;
}

function taskToRow(input: Partial<TaskUpsert>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.contentType !== undefined) row.content_type = input.contentType;
  if (input.rolesNeeded !== undefined) row.roles_needed = input.rolesNeeded;
  if (input.payPerRole !== undefined) row.pay_per_role = input.payPerRole;
  if (input.deadline !== undefined) row.deadline = input.deadline || null;
  if (input.location !== undefined) row.location = input.location || null;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

export async function createFreelancerTask(input: TaskUpsert) {
  const { error } = await client().from('freelancer_tasks').insert({ status: 'open', ...taskToRow(input) });
  if (error) throw error;
  await logAudit(`Created freelancer task "${input.title}"`);
}

export async function updateFreelancerTask(id: string, input: Partial<TaskUpsert>) {
  const { error } = await client().from('freelancer_tasks').update(taskToRow(input)).eq('id', id);
  if (error) throw error;
  await logAudit(`Updated freelancer task "${input.title ?? id}"`);
}

export async function deleteFreelancerTask(id: string, title?: string) {
  const { error } = await client().from('freelancer_tasks').delete().eq('id', id);
  if (error) throw error;
  await logAudit(`Deleted freelancer task "${title ?? id}"`);
}

// ---------------------------------------------------------------------------
// Assignments + review
// ---------------------------------------------------------------------------
export interface AdminAssignmentRow {
  id: string;
  taskId: string;
  taskTitle: string;
  freelancerId: string;
  freelancerName: string;
  role: string;
  status: string;
  contentUrl: string | null;
  notes: string | null;
  payRupees: number;
  submitted: string;
  created: string;
}

export async function fetchAssignments(): Promise<AdminAssignmentRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('task_assignments')
    .select('*, task:freelancer_tasks(title), freelancer:freelancers(name)')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map((a) => ({
    id: a.id,
    taskId: a.task_id,
    taskTitle: a.task?.title ?? 'Task',
    freelancerId: a.freelancer_id,
    freelancerName: a.freelancer?.name ?? 'Unknown',
    role: a.role,
    status: a.status ?? 'assigned',
    contentUrl: a.content_url ?? null,
    notes: a.notes ?? null,
    payRupees: Number(a.payment_amount_paise || 0) / 100,
    submitted: a.submitted_at ? formatDate(a.submitted_at) : '—',
    created: a.created_at ? formatDate(a.created_at) : '—',
  }));
}

export async function assignFreelancer(input: {
  taskId: string; freelancerId: string; role: string; payRupees: number; taskTitle?: string; freelancerName?: string;
}) {
  const { error } = await client().from('task_assignments').insert({
    task_id: input.taskId,
    freelancer_id: input.freelancerId,
    role: input.role,
    payment_amount_paise: Math.round(input.payRupees * 100),
    status: 'assigned',
  });
  if (error) throw error;
  await client().from('freelancer_tasks').update({ status: 'assigned' }).eq('id', input.taskId);
  await logAudit(`Assigned ${input.freelancerName ?? input.freelancerId} to "${input.taskTitle ?? input.taskId}" as ${input.role}`);
}

/** Accept submitted content and queue the payout as a pending earning. */
export async function approveSubmission(a: AdminAssignmentRow) {
  const db = client();
  const { error } = await db.from('task_assignments')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', a.id);
  if (error) throw error;

  const { error: earnErr } = await db.from('freelancer_earnings').insert({
    freelancer_id: a.freelancerId,
    assignment_id: a.id,
    type: 'task',
    amount_paise: Math.round(a.payRupees * 100),
    description: `${a.taskTitle} — ${a.role}`,
    status: 'pending',
  });
  if (earnErr) throw earnErr;

  await logAudit(`Approved content from ${a.freelancerName} for "${a.taskTitle}"`);
}

export async function requestRevision(a: AdminAssignmentRow, notes: string) {
  const { error } = await client().from('task_assignments')
    .update({ status: 'revision', notes })
    .eq('id', a.id);
  if (error) throw error;
  await logAudit(`Requested revision from ${a.freelancerName} on "${a.taskTitle}"`);
}

/** Release the queued payout: earning → paid, assignment → paid, roster total up. */
export async function releasePayment(a: AdminAssignmentRow) {
  const db = client();
  const now = new Date().toISOString();

  const { error } = await db.from('task_assignments').update({ status: 'paid', paid_at: now }).eq('id', a.id);
  if (error) throw error;

  // Matched by assignment_id so two equal-value pending payouts can't be confused.
  await db.from('freelancer_earnings')
    .update({ status: 'paid', paid_at: now })
    .eq('assignment_id', a.id)
    .eq('status', 'pending');

  const { data: f } = await db.from('freelancers').select('total_earned_paise').eq('id', a.freelancerId).maybeSingle();
  const nextTotal = Number((f as any)?.total_earned_paise || 0) + Math.round(a.payRupees * 100);
  await db.from('freelancers').update({ total_earned_paise: nextTotal }).eq('id', a.freelancerId);

  await logAudit(`Released ₹${a.payRupees.toLocaleString('en-IN')} to ${a.freelancerName} for "${a.taskTitle}"`);
}

// ---------------------------------------------------------------------------
// Earnings / payments tab
// ---------------------------------------------------------------------------
export interface AdminEarningRow {
  id: string;
  freelancerId: string;
  freelancerName: string;
  type: string;
  amountRupees: number;
  description: string;
  status: string;
  date: string;
}

export async function fetchAllEarnings(): Promise<AdminEarningRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('freelancer_earnings')
    .select('*, freelancer:freelancers(name)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error || !data) return [];
  return (data as any[]).map((e) => ({
    id: e.id,
    freelancerId: e.freelancer_id,
    freelancerName: e.freelancer?.name ?? 'Unknown',
    type: e.type,
    amountRupees: Number(e.amount_paise || 0) / 100,
    description: e.description ?? '',
    status: e.status ?? 'pending',
    date: e.created_at ? formatDate(e.created_at) : '—',
  }));
}

export async function markEarningPaid(row: AdminEarningRow) {
  const db = client();
  const { error } = await db.from('freelancer_earnings')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', row.id);
  if (error) throw error;

  const { data: f } = await db.from('freelancers').select('total_earned_paise').eq('id', row.freelancerId).maybeSingle();
  const nextTotal = Number((f as any)?.total_earned_paise || 0) + Math.round(row.amountRupees * 100);
  await db.from('freelancers').update({ total_earned_paise: nextTotal }).eq('id', row.freelancerId);

  await logAudit(`Paid ₹${row.amountRupees.toLocaleString('en-IN')} to ${row.freelancerName}`);
}
