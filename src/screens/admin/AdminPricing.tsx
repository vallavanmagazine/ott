/**
 * Pricing — the rate card sponsors buy against.
 *
 * Two independent price lists:
 *   - display-ad district tiers (₹/day by district count), which the sponsor
 *     campaign builder snaps up to when choosing coverage;
 *   - Inspire production packages (Spotlight / Prestige), which bundle a video
 *     shoot with free wallet credit and optional magazine inclusion.
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, IndianRupee, Sparkles } from 'lucide-react';
import {
  fetchAdminPricingRates, createPricingRate, updatePricingRate, deletePricingRate,
  fetchAdminInspirePackages, createInspirePackage, updateInspirePackage, deleteInspirePackage,
  type AdminPricingRate, type AdminInspirePackage, type InspirePackageInput,
} from '@/services/admin-pricing';
import { useToast } from '@/components/admin/Toast';
import { rupees } from '@/lib/admin-options';
import {
  AdminModal, SaveBar, ConfirmDialog, Field, TextInput, TextArea, ToggleRow,
  InlineToggle, StatCard, SkeletonTable, EmptyState, IconButton, Tabs, useBusy,
} from '@/components/admin/ui';

type Tab = 'rates' | 'packages';

interface RateForm { coverage: string; districtsCount: number; dailyRateRupees: number }
const BLANK_RATE: RateForm = { coverage: '', districtsCount: 1, dailyRateRupees: 99 };

const BLANK_PACKAGE: InspirePackageInput = {
  name: '', priceRupees: 9999, productionCostRupees: 4000, videoDurationMin: 10,
  freeCreditRupees: 2000, includesMagazine: false, description: '', isActive: true,
};

export function AdminPricing() {
  const toast = useToast();
  const { isBusy, withBusy } = useBusy();

  const [tab, setTab] = useState<Tab>('rates');
  const [rates, setRates] = useState<AdminPricingRate[]>([]);
  const [packages, setPackages] = useState<AdminInspirePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingRate, setEditingRate] = useState<AdminPricingRate | 'new' | null>(null);
  const [deletingRate, setDeletingRate] = useState<AdminPricingRate | null>(null);
  const [editingPkg, setEditingPkg] = useState<AdminInspirePackage | 'new' | null>(null);
  const [deletingPkg, setDeletingPkg] = useState<AdminInspirePackage | null>(null);

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([fetchAdminPricingRates(), fetchAdminInspirePackages()]);
    setRates(r); setPackages(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRate = (r: AdminPricingRate) => withBusy(r.id, async () => {
    try {
      await updatePricingRate(r.id, { isActive: !r.isActive });
      toast.success(`"${r.coverage}" ${r.isActive ? 'hidden' : 'enabled'}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const togglePackage = (p: AdminInspirePackage) => withBusy(p.id, async () => {
    try {
      await updateInspirePackage(p.id, { isActive: !p.isActive });
      toast.success(`"${p.name}" ${p.isActive ? 'hidden' : 'enabled'}`);
      await load();
    } catch (e) { toast.error((e as Error).message); }
  });

  const saveRate = async (form: RateForm) => {
    if (editingRate === 'new') {
      await createPricingRate(form);
      toast.success(`Tier "${form.coverage}" added`);
    } else if (editingRate) {
      await updatePricingRate(editingRate.id, form);
      toast.success(`Tier "${form.coverage}" updated`);
    }
    setEditingRate(null);
    await load();
  };

  const savePackage = async (form: InspirePackageInput) => {
    if (editingPkg === 'new') {
      await createInspirePackage(form);
      toast.success(`Package "${form.name}" added`);
    } else if (editingPkg) {
      await updateInspirePackage(editingPkg.id, form);
      toast.success(`Package "${form.name}" updated`);
    }
    setEditingPkg(null);
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Rate Tiers" value={rates.length} icon={<IndianRupee size={13} />} />
        <StatCard label="Active Tiers" value={rates.filter((r) => r.isActive).length} accent="text-green-400" />
        <StatCard label="Inspire Packages" value={packages.length} icon={<Sparkles size={13} />} />
        <StatCard
          label="Entry Rate"
          value={rates.length > 0 ? `${rupees(Math.min(...rates.map((r) => r.dailyRateRupees)))}/day` : '—'}
          accent="text-vgold"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Tabs<Tab>
          tabs={[
            { key: 'rates', label: 'Display Ad Rates', count: rates.length },
            { key: 'packages', label: 'Inspire Packages', count: packages.length },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="flex-1" />
        <button
          onClick={() => (tab === 'rates' ? setEditingRate('new') : setEditingPkg('new'))}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95"
        >
          <Plus size={16} /> {tab === 'rates' ? 'Add Tier' : 'Add Package'}
        </button>
      </div>

      {loading ? <SkeletonTable rows={4} cols={4} /> : tab === 'rates' ? (
        rates.length === 0 ? <EmptyState title="No rate tiers configured" hint="Add at least one tier so campaigns can be priced." /> : (
          <div className="rounded-xl glass overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
                  <th className="text-left px-4 py-3 font-bold">Coverage</th>
                  <th className="text-left px-4 py-3 font-bold">Districts</th>
                  <th className="text-left px-4 py-3 font-bold">Daily Rate</th>
                  <th className="text-left px-4 py-3 font-bold">30-Day</th>
                  <th className="text-center px-4 py-3 font-bold">Active</th>
                  <th className="text-right px-4 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3 font-semibold text-white">{r.coverage}</td>
                    <td className="px-4 py-3 text-vmuted tabular-nums">{r.districtsCount}</td>
                    <td className="px-4 py-3 text-vgold font-bold tabular-nums">{rupees(r.dailyRateRupees)}/day</td>
                    <td className="px-4 py-3 text-vmuted tabular-nums">{rupees(r.dailyRateRupees * 30)}</td>
                    <td className="px-4 py-3 text-center">
                      <InlineToggle on={r.isActive} onClick={() => toggleRate(r)} title="Show to sponsors" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton onClick={() => setEditingRate(r)} title="Edit tier"><Pencil size={14} /></IconButton>
                        <IconButton onClick={() => setDeletingRate(r)} title="Delete tier" danger disabled={isBusy(r.id)}><Trash2 size={14} /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        packages.length === 0 ? <EmptyState title="No Inspire packages" /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {packages.map((p) => (
              <div key={p.id} className="p-4 rounded-xl glass">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-white">{p.name}</h4>
                      {p.includesMagazine && (
                        <span className="px-2 py-0.5 rounded-full bg-vgold/15 text-vgold text-[9px] font-bold">+ MAGAZINE</span>
                      )}
                    </div>
                    <div className="text-2xl font-black text-vgold mt-1">{rupees(p.priceRupees)}</div>
                    {p.description && <p className="text-[11px] text-vmuted mt-1">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <InlineToggle on={p.isActive} onClick={() => togglePackage(p)} title="Sell this package" />
                    <IconButton onClick={() => setEditingPkg(p)} title="Edit package"><Pencil size={14} /></IconButton>
                    <IconButton onClick={() => setDeletingPkg(p)} title="Delete package" danger disabled={isBusy(p.id)}><Trash2 size={14} /></IconButton>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
                  <div>
                    <div className="text-sm font-bold text-white">{p.videoDurationMin} min</div>
                    <div className="text-[9px] text-vmuted uppercase tracking-wider">Video</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-green-400">{rupees(p.freeCreditRupees)}</div>
                    <div className="text-[9px] text-vmuted uppercase tracking-wider">Free Credit</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/70">{rupees(p.productionCostRupees)}</div>
                    <div className="text-[9px] text-vmuted uppercase tracking-wider">Prod. Cost</div>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-vmuted">
                  Margin: <span className="text-white/80 font-bold">
                    {rupees(p.priceRupees - p.productionCostRupees - p.freeCreditRupees)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {editingRate && (
        <RateFormModal
          initial={editingRate === 'new' ? BLANK_RATE : {
            coverage: editingRate.coverage,
            districtsCount: editingRate.districtsCount,
            dailyRateRupees: editingRate.dailyRateRupees,
          }}
          isNew={editingRate === 'new'}
          onClose={() => setEditingRate(null)}
          onSave={saveRate}
        />
      )}

      {editingPkg && (
        <PackageFormModal
          initial={editingPkg === 'new' ? BLANK_PACKAGE : {
            name: editingPkg.name,
            priceRupees: editingPkg.priceRupees,
            productionCostRupees: editingPkg.productionCostRupees,
            videoDurationMin: editingPkg.videoDurationMin,
            freeCreditRupees: editingPkg.freeCreditRupees,
            includesMagazine: editingPkg.includesMagazine,
            description: editingPkg.description,
            isActive: editingPkg.isActive,
          }}
          isNew={editingPkg === 'new'}
          onClose={() => setEditingPkg(null)}
          onSave={savePackage}
        />
      )}

      {deletingRate && (
        <ConfirmDialog
          title="Delete rate tier?"
          message={`"${deletingRate.coverage}" will be removed. Existing campaigns keep their stored daily rate.`}
          onConfirm={() => withBusy(deletingRate.id, async () => {
            try {
              await deletePricingRate(deletingRate.id, deletingRate.coverage);
              toast.success('Tier deleted');
              setDeletingRate(null);
              await load();
            } catch (e) { toast.error((e as Error).message); }
          })}
          onCancel={() => setDeletingRate(null)}
          busy={isBusy(deletingRate.id)}
        />
      )}

      {deletingPkg && (
        <ConfirmDialog
          title="Delete package?"
          message={`"${deletingPkg.name}" will be removed from the rate card.`}
          onConfirm={() => withBusy(deletingPkg.id, async () => {
            try {
              await deleteInspirePackage(deletingPkg.id, deletingPkg.name);
              toast.success('Package deleted');
              setDeletingPkg(null);
              await load();
            } catch (e) { toast.error((e as Error).message); }
          })}
          onCancel={() => setDeletingPkg(null)}
          busy={isBusy(deletingPkg.id)}
        />
      )}
    </div>
  );
}

function RateFormModal({
  initial, isNew, onClose, onSave,
}: { initial: RateForm; isNew: boolean; onClose: () => void; onSave: (f: RateForm) => Promise<void> }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof RateForm>(k: K, v: RateForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.coverage.trim()) { toast.error('Coverage label is required'); return; }
    if (form.dailyRateRupees <= 0) { toast.error('Daily rate must be above zero'); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={isNew ? 'Add Rate Tier' : 'Edit Rate Tier'}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} />}
    >
      <Field label="Coverage label" required hint="Shown to sponsors, e.g. '5 Districts'">
        <TextInput value={form.coverage} onChange={(e) => set('coverage', e.target.value)} placeholder="5 Districts" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="District count" required hint="Campaigns snap up to the nearest tier.">
          <TextInput type="number" min={1} max={38} value={form.districtsCount} onChange={(e) => set('districtsCount', Number(e.target.value))} />
        </Field>
        <Field label="Daily rate (₹)" required>
          <TextInput type="number" min={1} value={form.dailyRateRupees} onChange={(e) => set('dailyRateRupees', Number(e.target.value))} />
        </Field>
      </div>
      <div className="p-3 rounded-xl glass text-[11px] text-vmuted">
        A 30-day campaign at this tier costs <span className="text-vgold font-bold">{rupees(form.dailyRateRupees * 30)}</span>.
      </div>
    </AdminModal>
  );
}

function PackageFormModal({
  initial, isNew, onClose, onSave,
}: { initial: InspirePackageInput; isNew: boolean; onClose: () => void; onSave: (f: InspirePackageInput) => Promise<void> }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof InspirePackageInput>(k: K, v: InspirePackageInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const margin = form.priceRupees - form.productionCostRupees - form.freeCreditRupees;

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Package name is required'); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  return (
    <AdminModal
      title={isNew ? 'Add Inspire Package' : 'Edit Inspire Package'}
      subtitle={`Margin ${rupees(margin)}`}
      onClose={onClose}
      footer={<SaveBar onCancel={onClose} onSave={submit} saving={saving} />}
    >
      <Field label="Package name" required>
        <TextInput value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Spotlight" />
      </Field>
      <Field label="Description">
        <TextArea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (₹)" required>
          <TextInput type="number" min={0} value={form.priceRupees} onChange={(e) => set('priceRupees', Number(e.target.value))} />
        </Field>
        <Field label="Production cost (₹)">
          <TextInput type="number" min={0} value={form.productionCostRupees} onChange={(e) => set('productionCostRupees', Number(e.target.value))} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Video duration (min)">
          <TextInput type="number" min={1} value={form.videoDurationMin} onChange={(e) => set('videoDurationMin', Number(e.target.value))} />
        </Field>
        <Field label="Free wallet credit (₹)">
          <TextInput type="number" min={0} value={form.freeCreditRupees} onChange={(e) => set('freeCreditRupees', Number(e.target.value))} />
        </Field>
      </div>
      <ToggleRow
        on={form.includesMagazine}
        onChange={(v) => set('includesMagazine', v)}
        label="Includes magazine feature"
        sub="Bundles a print feature in the Vallavan magazine"
      />
      <ToggleRow on={form.isActive} onChange={(v) => set('isActive', v)} label="Available to sponsors" />
    </AdminModal>
  );
}
