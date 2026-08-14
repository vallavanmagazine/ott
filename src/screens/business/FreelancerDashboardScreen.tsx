import { useState, useEffect } from 'react';
import { Briefcase, ListChecks, Upload, Wallet, BookOpen, IndianRupee } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { fetchOpenTasks, fetchMyFreelancer, type FreelancerTask } from '@/services/freelancer';

export function FreelancerDashboardScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (key: string) => void }) {
  const [tasks, setTasks] = useState<FreelancerTask[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchOpenTasks().then(setTasks);
    fetchMyFreelancer().then(setProfile);
  }, []);

  const go = (key: string) => onNavigate?.(key);
  const tiles = [
    { icon: ListChecks, label: 'Available Tasks', key: '' },
    { icon: Briefcase, label: 'My Assignments', key: 'freelancer-submit' },
    { icon: Upload, label: 'Submit Content', key: 'freelancer-submit' },
    { icon: Wallet, label: 'Earnings', key: 'freelancer-earnings' },
    { icon: BookOpen, label: 'Magazine Reseller', key: 'magazine-reseller' },
    { icon: IndianRupee, label: 'Ad Sales', key: 'ad-sales' },
  ];

  const status = profile?.status as string | undefined;
  const paid = profile?.subscription_paid === true;

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Freelancer Dashboard" onBack={onBack} />
      <div className="px-4 max-w-[720px] mx-auto w-full">
        {profile && (
          <div className="mt-4 p-4 rounded-card glass-strong">
            <div className="text-sm font-black text-white">{profile.name}</div>
            <div className="text-[11px] text-vmuted">{(profile.roles ?? []).join(', ')}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${status === 'approved' ? 'bg-green-500/15 text-green-400' : 'bg-vgold/15 text-vgold'}`}>{status ?? 'pending'}</span>
              {!paid && status === 'approved' && <span className="text-[10px] text-vred font-bold">Enrollment fee pending</span>}
            </div>
          </div>
        )}

        <section className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tiles.map((t) => (
            <button key={t.label} onClick={() => t.key && go(t.key)} className="p-3.5 rounded-card glass text-left active:scale-95 transition">
              <t.icon size={18} className="text-vgold" />
              <div className="text-sm font-bold text-white mt-2">{t.label}</div>
            </button>
          ))}
        </section>

        <h2 className="text-base font-black text-white mt-6 mb-3">Available Tasks</h2>
        {tasks.length === 0 ? (
          <div className="p-6 rounded-card glass text-center text-sm text-vmuted">No open tasks right now.</div>
        ) : (
          <div className="space-y-2.5">
            {tasks.map((t) => (
              <div key={t.id} className="p-3.5 rounded-card glass">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{t.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-vred/15 text-vred text-[9px] font-black uppercase">{t.contentType}</span>
                </div>
                <div className="text-[11px] text-vmuted mt-1 line-clamp-2">{t.description}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.rolesNeeded.map((r) => <span key={r} className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-white/70 font-bold">{r}</span>)}
                </div>
                <div className="text-[10px] text-vmuted mt-2">Deadline: {t.deadline} · {t.location}</div>
              </div>
            ))}
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
