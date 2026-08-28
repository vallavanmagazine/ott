/**
 * Freelancers — applications, the active roster, task management and payouts.
 *
 * The review pipeline is: task created (open) → freelancer assigned (assigned)
 * → content submitted (submitted) → admin approves (approved, which queues a
 * PENDING earning) → admin releases payment (paid). Approving work and paying
 * for it stay separate so each is its own audited decision.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check, X, Plus, Briefcase, Users, IndianRupee, Pencil, Trash2,
  ExternalLink, UserPlus, RotateCcw, Download,
} from 'lucide-react';
import {
  fetchFreelancers, fetchTasks, fetchAssignments, fetchAllEarnings,
  createFreelancerTask, updateFreelancerTask, deleteFreelancerTask,
  assignFreelancer, approveSubmission, requestRevision, releasePayment, markEarningPaid,
  type AdminFreelancerRow, type AdminTaskRow, type AdminAssignmentRow, type AdminEarningRow, type TaskUpsert,
} from '@/services/admin-freelancers';
import { setFreelancerStatus, FREELANCER_ROLES } from '@/services/freelancer';
import { tamilNaduDistricts } from '@/data/mockData';
import { useToast } from '@/components/admin/Toast';
import { rupees, rupeesCompactINR } from '@/lib/admin-options';
import { downloadCsv, datedFilename } from '@/lib/csv';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea, SelectInput,
  SearchInput, StatusPill, StatCard, SkeletonTable, EmptyState, IconButton,
  Tabs, useBusy,
} from '@/components/admin/ui';

type Tab = 'applications' | 'roster' | 'tasks' | 'payments';

const CONTENT_TYPES = ['FEED', 'EXPLORE', 'INSPIRE'] as const;

export function AdminFreelancers() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [tab, setTab] = useState<Tab>('applications');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [rosterStatus, setRosterStatus] = useState('approved');

  const [people, setPeople] = useState<AdminFreelancerRow[]>([]);
  const [tasks, setTasks] = useState<AdminTaskRow[]>([]);
  const [assignments, setAssignments] = useState<AdminAssignmentRow[]>([]);
  const [earnings, setEarnings] = useState<AdminEarningRow[]>([]);

  const [editingTask, setEditingTask] = useState<AdminTaskRow | 'new' | null>(null);
  const [deletingTask, setDeletingTask] = useState<AdminTaskRow | null>(null);
  const [assigningTo, setAssigningTo] = useState<AdminTaskRow | null>(null);
  const [reviewing, setReviewing] = useState<AdminAssignmentRow | null>(null);
  const [viewingPerson, setViewingPerson] = useState<AdminFreelancerRow | null>(null);

  const load = useCallback(async () => {
    const [p, t, a, e] = await Promise.all([
      fetchFreelancers(), fetchTasks(), fetchAssignments(), fetchAllEarnings(),
    ]);
    setPeople(p); setTasks(t); setAssignments(a); setEarnings(e);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = people.filter((p) => p.status === 'pending');
  const approved = people.filter((p) => p.status === 'approved');
  /** Everyone past the application stage — approved, suspended or rejected. */
  const decided = people.filter((p) => p.status !== 'pending');

  const filteredRoster = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decided.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.includes(q);
      const matchesRole = roleFilter === 'All' || p.roles.includes(roleFilter);
      const matchesStatus = rosterStatus === 'All' || p.status === rosterStatus;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [decided, query, roleFilter, rosterStatus]);

  const MESSAGES: Record<string, (name: string) => string> = {
    approved: (n) => `${n} approved — they can now sign in and take tasks.`,
    rejected: (n) => `${n}'s application was rejected.`,
    suspended: (n) => `${n} suspended — they can no longer take new tasks.`,
  };

  const decide = (p: AdminFreelancerRow, status: 'approved' | 'rejected' | 'suspended') => withBusy(p.id, async () => {
    try {
      await setFreelancerStatus(p.id, status, p.name);
      toast.success((MESSAGES[status] ?? ((n: string) => `${n} updated`))(p.name));
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const saveTask = async (form: TaskUpsert) => {
    if (editingTask === 'new') {
      await createFreelancerTask(form);
      toast.success(`Task "${form.title}" created`);
    } else if (editingTask) {
      await updateFreelancerTask(editingTask.id, form);
      toast.success(`Task "${form.title}" updated`);
    }
    setEditingTask(null);
    await load();
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;
    await withBusy(deletingTask.id, async () => {
      try {
        await deleteFreelancerTask(deletingTask.id, deletingTask.title);
        toast.success('Task deleted');
        setDeletingTask(null);
        await load();
      } catch (e) { toast.error((e as Error).message); }
    });
  };

  const payEarning = (row: AdminEarningRow) => withBusy(row.id, async () => {
    try {
      await markEarningPaid(row);
      toast.success(`Paid ${rupees(row.amountRupees)} to ${row.freelancerName}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const pendingEarnings = earnings.filter((e) => e.status !== 'paid');
  const paidEarnings = earnings.filter((e) => e.status === 'paid');
  const totalPaid = paidEarnings.reduce((s, e) => s + e.amountRupees, 0);
  const totalPending = pendingEarnings.reduce((s, e) => s + e.amountRupees, 0);

  const exportEarnings = () => {
    downloadCsv(
      datedFilename('vallavan-freelancer-payments'),
      ['Date', 'Freelancer', 'Type', 'Description', 'Amount (₹)', 'Status'],
      earnings.map((e) => [e.date, e.freelancerName, e.type, e.description, e.amountRupees, e.status]),
    );
    toast.success('Payment history exported');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Applications" value={pending.length} accent={pending.length > 0 ? 'text-vgold' : 'text-white'} icon={<Users size={13} />} />
        <StatCard label="Active Freelancers" value={approved.length} accent="text-green-400" />
        <StatCard label="Open Tasks" value={tasks.filter((t) => t.status === 'open').length} icon={<Briefcase size={13} />} />
        <StatCard label="Pending Payouts" value={rupeesCompactINR(totalPending)} accent="text-vred" icon={<IndianRupee size={13} />} />
      </div>

      <Tabs<Tab>
        tabs={[
          { key: 'applications', label: 'Applications', count: pending.length },
          { key: 'roster', label: 'Active Freelancers', count: approved.length },
          { key: 'tasks', label: 'Tasks', count: tasks.length },
          { key: 'payments', label: 'Payments', count: pendingEarnings.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? <SkeletonTable rows={5} cols={5} /> : (
        <>
          {/* ---------------------------------------------------- APPLICATIONS */}
          {tab === 'applications' && (
            pending.length === 0 ? <EmptyState title="No pending applications" hint="New applicants appear here for approval." /> : (
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl glass">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm font-bold text-white">{p.name}</div>
                        <div className="text-[11px] text-vmuted">{p.email} · {p.phone} · {p.district || 'No district'}</div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {p.roles.map((r) => (
                            <span key={r} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/80">{r}</span>
                          ))}
                        </div>
                        <div className="text-[11px] text-vmuted mt-2">
                          {p.experienceYears} yr experience
                          {p.portfolioUrl && (
                            <> · <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="text-vgold inline-flex items-center gap-0.5">Portfolio <ExternalLink size={9} /></a></>
                          )}
                          {p.showreelUrl && (
                            <> · <a href={p.showreelUrl} target="_blank" rel="noreferrer" className="text-vgold inline-flex items-center gap-0.5">Showreel <ExternalLink size={9} /></a></>
                          )}
                          {p.resumeUrl && (
                            <> · <a href={p.resumeUrl} target="_blank" rel="noreferrer" className="text-vgold inline-flex items-center gap-0.5">Resume <ExternalLink size={9} /></a></>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => decide(p, 'approved')}
                          disabled={isBusy(p.id)}
                          className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold flex items-center gap-1.5 hover:bg-green-500/30 active:scale-95 disabled:opacity-50"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => decide(p, 'rejected')}
                          disabled={isBusy(p.id)}
                          className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold flex items-center gap-1.5 hover:bg-red-500/30 active:scale-95 disabled:opacity-50"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ---------------------------------------------------------- ROSTER */}
          {tab === 'roster' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3">
                <SearchInput value={query} onChange={setQuery} placeholder="Search freelancers..." />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
                >
                  <option value="All">All Roles</option>
                  {FREELANCER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                  value={rosterStatus}
                  onChange={(e) => setRosterStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
                >
                  <option value="approved">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                  <option value="All">All</option>
                </select>
              </div>
              {filteredRoster.length === 0 ? <EmptyState title="No active freelancers match" /> : (
                <div className="rounded-xl glass overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                        <th className="text-left px-4 py-3 font-bold">Name</th>
                        <th className="text-left px-4 py-3 font-bold">Roles</th>
                        <th className="text-left px-4 py-3 font-bold hidden md:table-cell">District</th>
                        <th className="text-left px-4 py-3 font-bold">Tasks Done</th>
                        <th className="text-left px-4 py-3 font-bold">Earnings</th>
                        <th className="text-left px-4 py-3 font-bold">Status</th>
                        <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Joined</th>
                        <th className="text-right px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRoster.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[10px] text-vmuted">{p.email}</div>
                          </td>
                          <td className="px-4 py-3 text-vmuted text-[11px] max-w-[180px] truncate">{p.roles.join(', ')}</td>
                          <td className="px-4 py-3 text-vmuted hidden md:table-cell">{p.district || '—'}</td>
                          <td className="px-4 py-3 text-white tabular-nums">{p.tasksCompleted}</td>
                          <td className="px-4 py-3 text-vgold font-bold tabular-nums">{rupees(p.totalEarnedRupees)}</td>
                          <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                          <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{p.joined}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <IconButton onClick={() => setViewingPerson(p)} title="View profile"><Users size={14} /></IconButton>
                              <button
                                onClick={() => decide(p, p.status === 'approved' ? 'suspended' : 'approved')}
                                disabled={isBusy(p.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold disabled:opacity-50 ${
                                  p.status === 'approved' ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
                                }`}
                              >
                                {p.status === 'approved' ? 'Suspend' : 'Reactivate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ----------------------------------------------------------- TASKS */}
          {tab === 'tasks' && (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setEditingTask('new')}
                  className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95"
                >
                  <Plus size={16} /> Create Task
                </button>
              </div>
              {tasks.length === 0 ? <EmptyState title="No tasks yet" hint="Create a task, then assign an approved freelancer to it." /> : (
                <div className="space-y-3">
                  {tasks.map((t) => {
                    const taskAssignments = assignments.filter((a) => a.taskId === t.id);
                    return (
                      <div key={t.id} className="rounded-xl glass overflow-hidden">
                        <div className="p-4 flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-[220px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{t.title}</span>
                              <StatusPill status={t.status} />
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/70">{t.contentType}</span>
                            </div>
                            <p className="text-[11px] text-vmuted mt-1 line-clamp-2">{t.description}</p>
                            <div className="text-[10px] text-vmuted mt-1.5">
                              Roles: {t.rolesNeeded.join(', ') || '—'} · Deadline: {t.deadline} · {t.location || 'Any location'}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {Object.entries(t.payPerRole).map(([role, pay]) => (
                                <span key={role} className="px-2 py-0.5 rounded-full bg-vgold/15 text-vgold text-[10px] font-bold">
                                  {role}: {rupees(Number(pay))}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setAssigningTo(t)}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 text-[11px] font-bold flex items-center gap-1.5 active:scale-95"
                            >
                              <UserPlus size={13} /> Assign
                            </button>
                            <IconButton onClick={() => setEditingTask(t)} title="Edit task"><Pencil size={14} /></IconButton>
                            <IconButton onClick={() => setDeletingTask(t)} title="Delete task" danger><Trash2 size={14} /></IconButton>
                          </div>
                        </div>

                        {taskAssignments.length > 0 && (
                          <div className="border-t border-white/5 divide-y divide-white/5">
                            {taskAssignments.map((a) => (
                              <div key={a.id} className="px-4 py-2.5 flex items-center gap-3 bg-black/20">
                                <span className="text-[12px] text-white font-semibold">{a.freelancerName}</span>
                                <span className="text-[10px] text-vmuted">{a.role}</span>
                                <StatusPill status={a.status} />
                                {a.contentUrl && (
                                  <a href={a.contentUrl} target="_blank" rel="noreferrer" className="text-vgold text-[10px] inline-flex items-center gap-0.5">
                                    Content <ExternalLink size={9} />
                                  </a>
                                )}
                                <span className="flex-1" />
                                <span className="text-[11px] text-vgold font-bold tabular-nums">{rupees(a.payRupees)}</span>
                                {a.status === 'submitted' && (
                                  <button onClick={() => setReviewing(a)} className="px-2.5 py-1 rounded-lg bg-vred text-white text-[10px] font-bold">Review</button>
                                )}
                                {a.status === 'approved' && (
                                  <button
                                    onClick={() => withBusy(a.id, async () => {
                                      try { await releasePayment(a); toast.success(`Released ${rupees(a.payRupees)} to ${a.freelancerName}`); await load(); }
                                      catch (e) { toast.error((e as Error).message); }
                                    })}
                                    disabled={isBusy(a.id)}
                                    className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 text-[10px] font-bold disabled:opacity-50"
                                  >
                                    Release Payment
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* -------------------------------------------------------- PAYMENTS */}
          {tab === 'payments' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Pending" value={rupees(totalPending)} accent="text-vgold" />
                <StatCard label="Paid to date" value={rupees(totalPaid)} accent="text-green-400" />
                <StatCard label="Payout records" value={earnings.length} />
              </div>

              <div className="flex justify-end">
                <button onClick={exportEarnings} className="px-3 py-2 rounded-lg glass text-white text-xs font-bold flex items-center gap-1.5 active:scale-95">
                  <Download size={13} /> Export CSV
                </button>
              </div>

              {earnings.length === 0 ? <EmptyState title="No payouts recorded" hint="Approving submitted content queues a payout here." /> : (
                <div className="rounded-xl glass overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[680px]">
                    <thead>
                      <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                        <th className="text-left px-4 py-3 font-bold">Freelancer</th>
                        <th className="text-left px-4 py-3 font-bold">Type</th>
                        <th className="text-left px-4 py-3 font-bold">Description</th>
                        <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Date</th>
                        <th className="text-left px-4 py-3 font-bold">Amount</th>
                        <th className="text-left px-4 py-3 font-bold">Status</th>
                        <th className="text-right px-4 py-3 font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {earnings.map((e) => (
                        <tr key={e.id} className="hover:bg-white/5 transition">
                          <td className="px-4 py-3 font-semibold text-white">{e.freelancerName}</td>
                          <td className="px-4 py-3 text-vmuted text-[11px]">{e.type}</td>
                          <td className="px-4 py-3 text-vmuted text-[11px] max-w-[220px] truncate">{e.description}</td>
                          <td className="px-4 py-3 text-vmuted hidden md:table-cell">{e.date}</td>
                          <td className="px-4 py-3 text-vgold font-bold tabular-nums">{rupees(e.amountRupees)}</td>
                          <td className="px-4 py-3"><StatusPill status={e.status} /></td>
                          <td className="px-4 py-3 text-right">
                            {e.status !== 'paid' && (
                              <button
                                onClick={() => payEarning(e)}
                                disabled={isBusy(e.id)}
                                className="px-2.5 py-1 rounded-lg bg-green-500/20 text-green-400 text-[10px] font-bold disabled:opacity-50"
                              >
                                Approve Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {editingTask && (
        <TaskFormModal
          initial={editingTask === 'new' ? null : editingTask}
          onClose={() => setEditingTask(null)}
          onSave={saveTask}
        />
      )}

      {assigningTo && (
        <AssignModal
          task={assigningTo}
          freelancers={approved}
          onClose={() => setAssigningTo(null)}
          onAssigned={async () => { setAssigningTo(null); await load(); }}
        />
      )}

      {reviewing && (
        <ReviewModal
          assignment={reviewing}
          onClose={() => setReviewing(null)}
          onDone={async () => { setReviewing(null); await load(); }}
        />
      )}

      {viewingPerson && (
        <AdminModal title={viewingPerson.name} subtitle={viewingPerson.email} onClose={() => setViewingPerson(null)}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Tasks completed" value={viewingPerson.tasksCompleted} />
            <StatCard label="Lifetime earnings" value={rupees(viewingPerson.totalEarnedRupees)} accent="text-vgold" />
          </div>
          <div className="p-3.5 rounded-xl glass space-y-1.5 text-[12px]">
            <div><span className="text-vmuted">Phone:</span> <span className="text-white/85">{viewingPerson.phone || '—'}</span></div>
            <div><span className="text-vmuted">District:</span> <span className="text-white/85">{viewingPerson.district || '—'}</span></div>
            <div><span className="text-vmuted">Roles:</span> <span className="text-white/85">{viewingPerson.roles.join(', ') || '—'}</span></div>
            <div><span className="text-vmuted">Experience:</span> <span className="text-white/85">{viewingPerson.experienceYears} years</span></div>
            <div><span className="text-vmuted">Enrolment paid:</span> <span className="text-white/85">{viewingPerson.subscriptionPaid ? 'Yes' : 'No'}</span></div>
            <div><span className="text-vmuted">Joined:</span> <span className="text-white/85">{viewingPerson.joined}</span></div>
          </div>
          {viewingPerson.portfolioUrl && (
            <a href={viewingPerson.portfolioUrl} target="_blank" rel="noreferrer" className="block p-3 rounded-xl glass text-xs text-vgold">
              Portfolio: {viewingPerson.portfolioUrl}
            </a>
          )}
          <div>
            <h4 className="text-sm font-bold text-white mb-2">Assignments</h4>
            <div className="space-y-1.5">
              {assignments.filter((a) => a.freelancerId === viewingPerson.id).map((a) => (
                <div key={a.id} className="p-2.5 rounded-lg glass flex items-center gap-2">
                  <span className="flex-1 text-[12px] text-white truncate">{a.taskTitle}</span>
                  <span className="text-[10px] text-vmuted">{a.role}</span>
                  <StatusPill status={a.status} />
                  <span className="text-[11px] text-vgold font-bold">{rupees(a.payRupees)}</span>
                </div>
              ))}
              {assignments.filter((a) => a.freelancerId === viewingPerson.id).length === 0 && (
                <p className="text-xs text-vmuted">No assignments yet.</p>
              )}
            </div>
          </div>
        </AdminModal>
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${deletingTask.title}" and its assignment history will be removed.`}
          onConfirm={confirmDeleteTask}
          onCancel={() => setDeletingTask(null)}
          busy={isBusy(deletingTask.id)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task create / edit — pay is captured per selected role
// ---------------------------------------------------------------------------
function TaskFormModal({
  initial, onClose, onSave,
}: { initial: AdminTaskRow | null; onClose: () => void; onSave: (f: TaskUpsert) => Promise<void> }) {
  const toast = useToast();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [contentType, setContentType] = useState(initial?.contentType ?? 'FEED');
  const [roles, setRoles] = useState<string[]>(initial?.rolesNeeded ?? []);
  const [pay, setPay] = useState<Record<string, number>>(initial?.payPerRole ?? {});
  const [deadline, setDeadline] = useState(initial?.deadlineIso ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [status, setStatus] = useState(initial?.status ?? 'open');
  const [saving, setSaving] = useState(false);

  const toggleRole = (role: string) => {
    setRoles((prev) => {
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
      setPay((p) => {
        const copy = { ...p };
        if (next.includes(role)) copy[role] = copy[role] ?? 3000;
        else delete copy[role];
        return copy;
      });
      return next;
    });
  };

  const total = roles.reduce((s, r) => s + (Number(pay[r]) || 0), 0);

  const submit = async () => {
    if (!title.trim()) { toast.error('Task title is required'); return; }
    if (roles.length === 0) { toast.error('Select at least one role'); return; }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        contentType,
        rolesNeeded: roles,
        payPerRole: Object.fromEntries(roles.map((r) => [r, Number(pay[r]) || 0])),
        deadline: deadline || undefined,
        location: location.trim(),
        status,
      });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={initial ? 'Edit Task' : 'Create Task'}
      subtitle={roles.length > 0 ? `Total budget ${rupees(total)}` : undefined}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label={initial ? 'Save Changes' : 'Create Task'} />}
    >
      <Field label="Title" required>
        <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cover the Madurai flower market" />
      </Field>
      <Field label="Description">
        <TextArea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief for the freelancer..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Content type">
          <SelectInput value={contentType} onChange={(e) => setContentType(e.target.value)}>
            {CONTENT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectInput>
        </Field>
        <Field label="Status">
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
            {['open', 'assigned', 'completed', 'paid'].map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectInput>
        </Field>
      </div>

      <Field label="Roles needed" required hint="Pick roles, then set the pay for each.">
        <div className="flex flex-wrap gap-2">
          {FREELANCER_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRole(r)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold transition ${roles.includes(r) ? 'bg-vred text-white' : 'glass text-vmuted'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </Field>

      {roles.length > 0 && (
        <div className="p-3 rounded-xl glass space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Pay per role (₹)</div>
          {roles.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <span className="flex-1 text-[12px] text-white">{r}</span>
              <input
                type="number"
                min={0}
                value={pay[r] ?? 0}
                onChange={(e) => setPay((p) => ({ ...p, [r]: Number(e.target.value) }))}
                className="w-28 px-3 py-1.5 rounded-lg glass text-sm text-white outline-none tabular-nums"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Deadline">
          <TextInput type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Location">
          <SelectInput value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Any location</option>
            {tamilNaduDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
          </SelectInput>
        </Field>
      </div>
    </AdminModal>
  );
}

// ---------------------------------------------------------------------------
// Assign a freelancer to a task role
// ---------------------------------------------------------------------------
function AssignModal({
  task, freelancers, onClose, onAssigned,
}: {
  task: AdminTaskRow;
  freelancers: AdminFreelancerRow[];
  onClose: () => void;
  onAssigned: () => Promise<void>;
}) {
  const toast = useToast();
  const [role, setRole] = useState(task.rolesNeeded[0] ?? '');
  const [freelancerId, setFreelancerId] = useState('');
  const [saving, setSaving] = useState(false);

  /** Only offer people who actually hold the selected role. */
  const eligible = useMemo(
    () => freelancers.filter((f) => !role || f.roles.includes(role)),
    [freelancers, role],
  );

  useEffect(() => {
    if (!eligible.some((f) => f.id === freelancerId)) setFreelancerId(eligible[0]?.id ?? '');
  }, [eligible, freelancerId]);

  const pay = Number(task.payPerRole[role] ?? 0);

  const submit = async () => {
    if (!freelancerId) { toast.error('No approved freelancer holds that role yet.'); return; }
    setSaving(true);
    try {
      const person = freelancers.find((f) => f.id === freelancerId);
      await assignFreelancer({
        taskId: task.id, freelancerId, role, payRupees: pay,
        taskTitle: task.title, freelancerName: person?.name,
      });
      toast.success(`${person?.name} assigned to "${task.title}" as ${role}`);
      await onAssigned();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title="Assign Freelancer"
      subtitle={task.title}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label={`Assign · ${rupees(pay)}`} />}
    >
      <Field label="Role" required>
        <SelectInput value={role} onChange={(e) => setRole(e.target.value)}>
          {task.rolesNeeded.map((r) => <option key={r} value={r}>{r} — {rupees(Number(task.payPerRole[r] ?? 0))}</option>)}
        </SelectInput>
      </Field>
      <Field label="Freelancer" required hint="Only approved freelancers holding this role are listed.">
        <SelectInput value={freelancerId} onChange={(e) => setFreelancerId(e.target.value)}>
          {eligible.length === 0 && <option value="">No eligible freelancer</option>}
          {eligible.map((f) => (
            <option key={f.id} value={f.id}>{f.name} — {f.district || 'anywhere'} ({f.tasksCompleted} done)</option>
          ))}
        </SelectInput>
      </Field>
    </AdminModal>
  );
}

// ---------------------------------------------------------------------------
// Review submitted content
// ---------------------------------------------------------------------------
function ReviewModal({
  assignment, onClose, onDone,
}: { assignment: AdminAssignmentRow; onClose: () => void; onDone: () => Promise<void> }) {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const approve = async () => {
    setSaving(true);
    try {
      await approveSubmission(assignment);
      toast.success(`Approved — ${rupees(assignment.payRupees)} queued for payment`);
      await onDone();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const revise = async () => {
    if (!notes.trim()) { toast.error('Add a note explaining what needs changing'); return; }
    setSaving(true);
    try {
      await requestRevision(assignment, notes.trim());
      toast.success('Revision requested');
      await onDone();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title="Review Submission"
      subtitle={`${assignment.freelancerName} · ${assignment.role} · ${assignment.taskTitle}`}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button onClick={revise} disabled={saving} className="flex-1 py-3 rounded-full glass text-white font-bold text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
            <RotateCcw size={14} /> Request Revision
          </button>
          <button onClick={approve} disabled={saving} className="flex-1 py-3 rounded-full bg-green-500/25 text-green-400 font-bold text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Check size={15} /> Approve
          </button>
        </div>
      }
    >
      <div className="p-3.5 rounded-xl glass space-y-1.5 text-[12px]">
        <div><span className="text-vmuted">Submitted:</span> <span className="text-white/85">{assignment.submitted}</span></div>
        <div><span className="text-vmuted">Payment on approval:</span> <span className="text-vgold font-bold">{rupees(assignment.payRupees)}</span></div>
      </div>

      {assignment.contentUrl ? (
        <a href={assignment.contentUrl} target="_blank" rel="noreferrer" className="block p-3 rounded-xl glass text-xs text-vgold break-all">
          {assignment.contentUrl}
        </a>
      ) : (
        <EmptyState title="No content URL submitted" />
      )}

      {assignment.notes && (
        <div className="p-3 rounded-xl glass">
          <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold mb-1">Freelancer notes</div>
          <p className="text-xs text-white/85">{assignment.notes}</p>
        </div>
      )}

      <Field label="Revision notes" hint="Required only when requesting a revision.">
        <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What needs to change..." />
      </Field>
    </AdminModal>
  );
}
