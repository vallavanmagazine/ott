import { useState, useEffect } from 'react';
import { Send, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/services/admin-writes';

const PLATFORMS = ['Facebook', 'Instagram', 'X', 'YouTube', 'WhatsApp'];

export function AdminSocial() {
  const [caption, setCaption] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Facebook', 'Instagram']);
  const [scheduleAt, setScheduleAt] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => { if (supabase) supabase.from('social_posts').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => setPosts(data ?? [])); };
  useEffect(() => { load(); }, []);

  const save = async (status: 'draft' | 'scheduled') => {
    if (!supabase) { alert('Supabase not configured'); return; }
    if (!caption.trim()) { alert('Caption required'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.from('social_posts').insert({ caption, platforms, status, scheduled_at: status === 'scheduled' && scheduleAt ? new Date(scheduleAt).toISOString() : null });
      if (error) throw error;
      await logAudit(`Social post ${status} for ${platforms.join(', ')}`);
      setCaption(''); setScheduleAt(''); load();
    } catch (e) { alert(`Failed: ${(e as Error).message}`); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="p-4 rounded-xl glass">
        <h3 className="text-sm font-bold text-white mb-3">Compose Post</h3>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption… (content + active sponsor ad auto-embedded)" rows={3} className="w-full px-3 py-2.5 rounded-lg glass text-sm text-white outline-none resize-none" />
        <div className="flex flex-wrap gap-2 mt-3">
          {PLATFORMS.map((p) => <button key={p} onClick={() => setPlatforms((ps) => ps.includes(p) ? ps.filter((x) => x !== p) : [...ps, p])} className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${platforms.includes(p) ? 'bg-vred text-white' : 'glass text-vmuted'}`}>{p}</button>)}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-lg glass"><Calendar size={14} className="text-vmuted" /><input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="flex-1 bg-transparent text-sm text-white outline-none" /></div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => save('scheduled')} disabled={busy} className="flex-1 py-2.5 rounded-full glass text-white text-xs font-bold disabled:opacity-50">Schedule</button>
          <button onClick={() => save('draft')} disabled={busy} className="flex-1 py-2.5 rounded-full bg-vred text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"><Send size={13} /> Save Draft</button>
        </div>
        <p className="text-[10px] text-vmuted mt-2">Meta publishing is stubbed — no live API calls. Posts are queued in social_posts.</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white mb-2">Queue</h3>
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className="p-3 rounded-lg glass flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.status === 'scheduled' ? 'bg-blue-500/15 text-blue-400' : 'bg-white/10 text-vmuted'}`}>{p.status}</span>
              <span className="flex-1 text-xs text-white truncate">{p.caption}</span>
              <span className="text-[10px] text-vmuted">{(p.platforms ?? []).join(', ')}</span>
            </div>
          ))}
          {posts.length === 0 && <div className="p-6 rounded-lg glass text-center text-sm text-vmuted">No posts yet</div>}
        </div>
      </div>
    </div>
  );
}
