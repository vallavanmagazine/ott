import { useState } from 'react';
import { Briefcase } from 'lucide-react';
import { SubPageHeader } from '@/components/ScreenShell';
import { tamilNaduDistricts } from '@/data/mockData';
import { applyFreelancer, FREELANCER_ROLES, ENROLLMENT_FEE_RUPEES } from '@/services/freelancer';
import { DownloadAppCard } from '@/components/GetApp';

const ROLE_INFO: Record<string, { desc: string; pay: string }> = {
  Reporter: { desc: 'Field reporting, news gathering', pay: '₹1,500–5,000 / story' },
  Anchor: { desc: 'On-camera presentation', pay: '₹2,000–8,000 / shoot' },
  Writer: { desc: 'Script writing, research', pay: '₹1,000–4,000 / script' },
  'Visual Editor': { desc: 'Video editing, color grading', pay: '₹2,000–10,000 / project' },
  'Program Producer': { desc: 'Project management', pay: '₹5,000–20,000 / project' },
};

export function FreelancerCareerScreen({ onBack }: { onBack: () => void }) {
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', district: 'Chennai', roles: [] as string[], experienceYears: 0, portfolioUrl: '', showreelUrl: '', resumeUrl: '', agree: false });

  const toggleRole = (r: string) => setForm((f) => ({ ...f, roles: f.roles.includes(r) ? f.roles.filter((x) => x !== r) : [...f.roles, r] }));

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || form.roles.length === 0) { alert('Name, phone, email and at least one role are required.'); return; }
    if (!form.agree) { alert('Please agree to the Terms to continue.'); return; }
    setBusy(true);
    try { await applyFreelancer(form); setDone(true); }
    catch (e) { alert(`Submit failed: ${(e as Error).message}. (You may need to be signed in.)`); }
    finally { setBusy(false); }
  };

  const inp = 'w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred';

  if (done) {
    return (
      <div className="min-h-screen bg-vblack">
        <SubPageHeader title="Join as Freelancer" onBack={onBack} />
        <div className="px-4 mt-8 max-w-[560px] mx-auto w-full">
          <DownloadAppCard
            title="Application submitted! 🎉"
            subtitle={`Our team will review and notify you by email. After approval, a ₹${ENROLLMENT_FEE_RUPEES.toLocaleString('en-IN')} enrollment fee activates your Freelancer Dashboard — download the Vallavan app to access it.`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vblack">
      <SubPageHeader title="Join as Freelancer" onBack={onBack} />
      <div className="px-4 max-w-[720px] mx-auto w-full">
        <section className="mt-4 p-5 rounded-card bg-gradient-to-br from-vgold/15 via-vblack to-vblack border border-vgold/20">
          <Briefcase size={26} className="text-vgold" />
          <h1 className="text-xl font-black text-white mt-3">Build Tamil documentaries with us</h1>
          <p className="text-sm text-vmuted mt-1">Pick tasks, submit work, earn per project — plus magazine resale and ad-sales commission.</p>
        </section>

        {!applying ? (
          <>
            <h2 className="text-base font-black text-white mt-6 mb-3">Roles</h2>
            <div className="space-y-2">
              {FREELANCER_ROLES.map((r) => (
                <div key={r} className="p-3.5 rounded-card glass">
                  <div className="text-sm font-bold text-white">{r}</div>
                  <div className="text-[11px] text-vmuted">{ROLE_INFO[r].desc}</div>
                  <div className="text-[11px] text-vgold font-semibold mt-0.5">{ROLE_INFO[r].pay}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setApplying(true)} className="w-full mt-5 py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 shadow-glow">Apply Now</button>
          </>
        ) : (
          <div className="mt-5 space-y-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inp} />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className={inp} />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inp} />
            <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inp}>{tamilNaduDistricts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold mb-2">Roles applying for</div>
              <div className="flex flex-wrap gap-2">
                {FREELANCER_ROLES.map((r) => (
                  <button key={r} onClick={() => toggleRole(r)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${form.roles.includes(r) ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{r}</button>
                ))}
              </div>
            </div>
            <input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} placeholder="Years of experience" className={inp} />
            <input value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} placeholder="Portfolio URL (optional)" className={inp} />
            <input value={form.showreelUrl} onChange={(e) => setForm({ ...form, showreelUrl: e.target.value })} placeholder="Showreel URL (optional)" className={inp} />
            <input value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} placeholder="Resume URL (optional)" className={inp} />
            <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer">
              <input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} className="w-4 h-4 accent-vred" />
              <span className="text-xs text-white/90">I agree to the <span className="text-vgold font-semibold">Terms &amp; Conditions</span>.</span>
            </label>
            <button onClick={submit} disabled={busy} className="w-full py-3.5 rounded-full bg-vred text-white font-bold text-sm active:scale-95 disabled:opacity-50">{busy ? 'Submitting…' : 'Submit Application'}</button>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}
