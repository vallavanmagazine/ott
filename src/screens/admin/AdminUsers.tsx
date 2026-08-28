/**
 * Users — every account on the platform, with role changes and suspension.
 *
 * A user's detail view pulls their related records by email/id: sponsor org and
 * campaigns if they advertise, freelancer profile and assignments if they work
 * for the platform. Those live in different tables with no single join, so the
 * detail view fans out on open rather than bloating the list query.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, UserCog, Ban, CheckCircle2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchAdminUsers } from '@/services/admin';
import { suspendUser, activateUser, setUserRole, type UserRole } from '@/services/admin-writes';
import { useToast } from '@/components/admin/Toast';
import { USER_ROLES, rupees } from '@/lib/admin-options';
import { downloadCsv, datedFilename } from '@/lib/csv';
import {
  AdminModal, SaveBar, Field, SelectInput, SearchInput, StatusPill, StatCard,
  SkeletonTable, EmptyState, IconButton, useBusy,
} from '@/components/admin/ui';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  joined: string;
  status: string;
}

interface UserActivity {
  sponsorName: string | null;
  campaigns: { id: string; name: string; status: string; spend: number }[];
  freelancerStatus: string | null;
  assignments: { id: string; title: string; role: string; status: string }[];
}

export function AdminUsers() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [changingRole, setChangingRole] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setUsers((await fetchAdminUsers()) as UserRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const toggleStatus = (u: UserRow) => withBusy(u.id, async () => {
    try {
      if (u.status === 'Suspended') { await activateUser(u.id, u.name); toast.success(`${u.name} activated`); }
      else { await suspendUser(u.id, u.name); toast.success(`${u.name} suspended`); }
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const saveRole = async (u: UserRow, role: UserRole) => {
    await setUserRole(u.id, role, u.name);
    toast.success(`${u.name} is now a ${role}`);
    setChangingRole(null);
    await load();
  };

  const exportUsers = () => {
    downloadCsv(
      datedFilename('vallavan-users'),
      ['Name', 'Email', 'Role', 'Status', 'Joined'],
      filtered.map((u) => [u.name, u.email, u.role, u.status, u.joined]),
    );
    toast.success('Users exported');
  };

  const counts = useMemo(() => ({
    viewers: users.filter((u) => u.role === 'Viewer').length,
    sponsors: users.filter((u) => u.role === 'Sponsor').length,
    creators: users.filter((u) => u.role === 'Creator').length,
    admins: users.filter((u) => u.role === 'Admin').length,
  }), [users]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={users.length} icon={<Users size={13} />} />
        <StatCard label="Viewers" value={counts.viewers} accent="text-blue-400" />
        <StatCard label="Sponsors" value={counts.sponsors} accent="text-vgold" />
        <StatCard label="Creators / Admins" value={`${counts.creators} / ${counts.admins}`} accent="text-green-400" />
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name or email..." />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
          <option value="All">All Roles</option>
          {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none">
          {['All', 'Active', 'Pending', 'Suspended'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={exportUsers} className="px-4 py-2.5 rounded-xl glass text-white text-sm font-bold active:scale-95">
          Export CSV
        </button>
      </div>

      {loading ? <SkeletonTable rows={6} cols={5} /> : filtered.length === 0 ? (
        <EmptyState title="No users match those filters" />
      ) : (
        <div className="rounded-xl glass overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                <th className="text-left px-4 py-3 font-bold">Name</th>
                <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-bold">Role</th>
                <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-bold">Status</th>
                <th className="text-right px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 font-semibold text-white">{u.name}</td>
                  <td className="px-4 py-3 text-vmuted hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3"><span className="text-xs font-bold text-white/80">{u.role}</span></td>
                  <td className="px-4 py-3 text-vmuted hidden md:table-cell">{u.joined}</td>
                  <td className="px-4 py-3"><StatusPill status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton onClick={() => setViewing(u)} title="View profile"><Eye size={14} /></IconButton>
                      <IconButton onClick={() => setChangingRole(u)} title="Change role"><UserCog size={14} /></IconButton>
                      <button
                        onClick={() => toggleStatus(u)}
                        disabled={isBusy(u.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50 ${
                          u.status === 'Suspended' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {u.status === 'Suspended' ? <><CheckCircle2 size={11} /> Activate</> : <><Ban size={11} /> Suspend</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-vmuted">{filtered.length} of {users.length} users</p>

      {viewing && <UserDetailModal user={viewing} onClose={() => setViewing(null)} />}

      {changingRole && (
        <RoleModal
          user={changingRole}
          onClose={() => setChangingRole(null)}
          onSave={saveRole}
        />
      )}
    </div>
  );
}

function RoleModal({
  user, onClose, onSave,
}: { user: UserRow; onClose: () => void; onSave: (u: UserRow, role: UserRole) => Promise<void> }) {
  const toast = useToast();
  const [role, setRole] = useState<UserRole>((USER_ROLES as readonly string[]).includes(user.role) ? user.role as UserRole : 'Viewer');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try { await onSave(user, role); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title="Change Role"
      subtitle={user.name}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} label="Update Role" />}
    >
      <Field label="Role" hint="Admin grants full CMS access — assign it sparingly.">
        <SelectInput value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </SelectInput>
      </Field>
      {role === 'Admin' && user.role !== 'Admin' && (
        <div className="p-3 rounded-xl bg-vred/10 border border-vred/25">
          <p className="text-[11px] text-white/85">
            Admins can publish content, approve campaigns and move money. Confirm this person should have that access.
          </p>
        </div>
      )}
    </AdminModal>
  );
}

function UserDetailModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [activity, setActivity] = useState<UserActivity | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      if (!supabase) { setActivity({ sponsorName: null, campaigns: [], freelancerStatus: null, assignments: [] }); return; }

      const [sponsorRes, freelancerRes] = await Promise.all([
        supabase.from('sponsors').select('id, name').ilike('email', user.email).maybeSingle(),
        supabase.from('freelancers').select('id, status').ilike('email', user.email).maybeSingle(),
      ]);

      const sponsorId = (sponsorRes.data as any)?.id;
      const freelancerId = (freelancerRes.data as any)?.id;

      const [campaignRes, assignmentRes] = await Promise.all([
        sponsorId
          ? supabase.from('campaigns').select('id, name, status, spend_paise').eq('sponsor_id', sponsorId)
          : Promise.resolve({ data: [] as any[] }),
        freelancerId
          ? supabase.from('task_assignments').select('id, role, status, task:freelancer_tasks(title)').eq('freelancer_id', freelancerId)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      if (cancelled) return;
      setActivity({
        sponsorName: (sponsorRes.data as any)?.name ?? null,
        campaigns: (campaignRes.data ?? []).map((c: any) => ({
          id: c.id, name: c.name, status: c.status, spend: Number(c.spend_paise || 0) / 100,
        })),
        freelancerStatus: (freelancerRes.data as any)?.status ?? null,
        assignments: (assignmentRes.data ?? []).map((a: any) => ({
          id: a.id, title: a.task?.title ?? 'Task', role: a.role, status: a.status,
        })),
      });
    };

    loadActivity().catch(() => setActivity({ sponsorName: null, campaigns: [], freelancerStatus: null, assignments: [] }));
    return () => { cancelled = true; };
  }, [user.email]);

  return (
    <AdminModal title={user.name} subtitle={user.email} onClose={onClose}>
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Role" value={user.role} />
        <StatCard label="Status" value={user.status} accent={user.status === 'Active' ? 'text-green-400' : 'text-red-400'} />
        <StatCard label="Joined" value={user.joined} />
      </div>

      {!activity ? <SkeletonTable rows={3} cols={3} /> : (
        <>
          <div>
            <h4 className="text-sm font-bold text-white mb-2">
              Sponsor account {activity.sponsorName && <span className="text-vgold font-normal">· {activity.sponsorName}</span>}
            </h4>
            {activity.campaigns.length === 0 ? (
              <p className="text-xs text-vmuted">{activity.sponsorName ? 'No campaigns yet.' : 'Not a sponsor.'}</p>
            ) : (
              <div className="space-y-1.5">
                {activity.campaigns.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg glass flex items-center gap-2">
                    <span className="flex-1 text-[12px] text-white truncate">{c.name}</span>
                    <StatusPill status={c.status} />
                    <span className="text-[11px] text-vgold font-bold tabular-nums">{rupees(c.spend)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-2">
              Freelancer profile
              {activity.freelancerStatus && <span className="text-vgold font-normal"> · {activity.freelancerStatus}</span>}
            </h4>
            {activity.assignments.length === 0 ? (
              <p className="text-xs text-vmuted">{activity.freelancerStatus ? 'No assignments yet.' : 'Not a freelancer.'}</p>
            ) : (
              <div className="space-y-1.5">
                {activity.assignments.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg glass flex items-center gap-2">
                    <span className="flex-1 text-[12px] text-white truncate">{a.title}</span>
                    <span className="text-[10px] text-vmuted">{a.role}</span>
                    <StatusPill status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AdminModal>
  );
}
