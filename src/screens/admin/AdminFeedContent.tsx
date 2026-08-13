import { useState, useEffect } from 'react';
import {
  Plus, Search, MoreVertical, Upload, X, ChevronUp, ChevronDown,
  Film, Tag, Calendar, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { feedReels as mockFeedReels, genres, type FeedReel, type FeedContentType } from '@/data/mockData';
import { pexelsUrl } from '@/data/mockData';
import { fetchFeedReels } from '@/services/feed';
import { createFeedReel, deleteFeedReel } from '@/services/admin-writes';
import { DyneTubeUpload } from '@/components/DyneTubeUpload';

const contentTypes: FeedContentType[] = ['News', 'Teaser', 'Short Story', 'Other'];

const statusColors: Record<string, string> = {
  Published: 'text-green-400 bg-green-500/15',
  Draft: 'text-vgold bg-vgold/15',
  Scheduled: 'text-blue-400 bg-blue-500/15',
};

const typeColors: Record<string, string> = {
  News: 'text-red-300 bg-red-500/15',
  Teaser: 'text-purple-300 bg-purple-500/15',
  'Short Story': 'text-green-300 bg-green-500/15',
  Other: 'text-white/60 bg-white/10',
};

const mockCampaigns = [
  'Nilgiri Tea Summer Push',
  'Chennai Motors EV Awareness',
  'A2B Catering Festive Splash',
  'Jio Saavn Audio Promo',
  'Tata Salt Daily Connect',
];

export function AdminFeedContent() {
  const [query, setQuery] = useState('');
  const [reels, setReels] = useState<FeedReel[]>([...mockFeedReels].sort((a, b) => a.order - b.order));
  const [showUpload, setShowUpload] = useState(false);
  const [filterType, setFilterType] = useState<FeedContentType | 'All'>('All');

  const load = () => fetchFeedReels().then((r) => setReels([...r].sort((a, b) => a.order - b.order)));
  useEffect(() => { load(); }, []);

  const filtered = reels.filter((r) => {
    const matchesQuery = r.title.toLowerCase().includes(query.toLowerCase()) || r.titleTa.includes(query);
    const matchesType = filterType === 'All' || r.contentType === filterType;
    return matchesQuery && matchesType;
  });

  const moveReel = (id: string, dir: -1 | 1) => {
    setReels((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      [sorted[idx].order, sorted[swapIdx].order] = [sorted[swapIdx].order, sorted[idx].order];
      return [...sorted];
    });
  };

  const deleteReel = async (id: string) => {
    const reel = reels.find((r) => r.id === id);
    if (!window.confirm(`Delete "${reel?.title ?? 'this reel'}"?`)) return;
    try { await deleteFeedReel(id, reel?.title); await load(); }
    catch (e) { alert(`Delete failed: ${(e as Error).message}`); }
  };

  const toggleStripAd = (id: string) => {
    setReels((prev) => prev.map((r) => r.id === id ? { ...r, stripAdHost: !r.stripAdHost } : r));
  };

  const toggleBannerAfter = (id: string) => {
    setReels((prev) => prev.map((r) => r.id === id ? { ...r, bannerAfter: !r.bannerAfter } : r));
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Reels" value={reels.length} icon={<Film size={16} />} />
        <StatCard label="Published" value={reels.filter((r) => r.status === 'Published').length} accent="text-green-400" />
        <StatCard label="Drafts" value={reels.filter((r) => r.status === 'Draft').length} accent="text-vgold" />
        <StatCard label="Total Views" value={reels.reduce((s, r) => s + r.views, 0).toLocaleString('en-IN')} accent="text-blue-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl glass">
          <Search size={16} className="text-vmuted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feed content..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-vmuted outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FeedContentType | 'All')}
          className="px-4 py-2.5 rounded-xl glass text-sm text-white outline-none"
        >
          <option value="All">All Types</option>
          {contentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95 transition"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl glass overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-3 py-3 font-bold w-10">Order</th>
              <th className="text-left px-4 py-3 font-bold">Thumbnail</th>
              <th className="text-left px-4 py-3 font-bold">Title</th>
              <th className="text-left px-4 py-3 font-bold">Type</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Duration</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Views</th>
              <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Uploaded</th>
              <th className="text-center px-3 py-3 font-bold">Strip Ad</th>
              <th className="text-center px-3 py-3 font-bold">Banner After</th>
              <th className="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition">
                {/* Reorder controls */}
                <td className="px-3 py-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveReel(r.id, -1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-vmuted">
                      <ChevronUp size={14} />
                    </button>
                    <span className="text-[10px] text-vmuted text-center">{r.order + 1}</span>
                    <button onClick={() => moveReel(r.id, 1)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-vmuted">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </td>
                {/* Thumbnail */}
                <td className="px-4 py-3">
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    <img src={pexelsUrl(r.thumb, 150)} alt={r.title} className="w-full h-full object-cover" />
                  </div>
                </td>
                {/* Title */}
                <td className="px-4 py-3">
                  <div className="font-semibold text-white text-[13px]">{r.title}</div>
                  <div className="text-[11px] font-tamil text-vmuted">{r.titleTa}</div>
                  <div className="text-[10px] text-vmuted mt-0.5">{r.creator}</div>
                </td>
                {/* Content type */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${typeColors[r.contentType]}`}>
                    {r.contentType}
                  </span>
                </td>
                {/* Duration */}
                <td className="px-4 py-3 text-vmuted hidden md:table-cell">{r.duration}</td>
                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </td>
                {/* Views */}
                <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{r.views.toLocaleString('en-IN')}</td>
                {/* Uploaded */}
                <td className="px-4 py-3 text-vmuted hidden lg:table-cell">{r.uploaded}</td>
                {/* Strip ad toggle */}
                <td className="px-3 py-3 text-center">
                  <button onClick={() => toggleStripAd(r.id)} className="inline-flex">
                    {r.stripAdHost
                      ? <ToggleRight size={22} className="text-vred" />
                      : <ToggleLeft size={22} className="text-vmuted" />}
                  </button>
                </td>
                {/* Banner after toggle */}
                <td className="px-3 py-3 text-center">
                  <button onClick={() => toggleBannerAfter(r.id)} className="inline-flex">
                    {r.bannerAfter
                      ? <ToggleRight size={22} className="text-vred" />
                      : <ToggleLeft size={22} className="text-vmuted" />}
                  </button>
                </td>
                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-vmuted hover:text-white">
                      <MoreVertical size={14} />
                    </button>
                    <button
                      onClick={() => deleteReel(r.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-vmuted hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload / Add new modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onAdd={async (newReel) => {
            try {
              await createFeedReel({
                title: newReel.title,
                titleTa: newReel.titleTa,
                caption: newReel.caption,
                captionTa: newReel.captionTa,
                contentType: newReel.contentType,
                genre: newReel.genre,
                durationSec: newReel.durationSec,
                thumb: newReel.thumb,
                status: newReel.status,
                stripAdHost: newReel.stripAdHost,
                bannerAfter: newReel.bannerAfter,
                sortOrder: newReel.order,
                videoUrl: newReel.videoUrl,
              });
              setShowUpload(false);
              await load();
            } catch (e) { alert(`Create failed: ${(e as Error).message}`); }
          }}
          nextOrder={reels.length}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon?: React.ReactNode; accent?: string }) {
  return (
    <div className="p-3 rounded-xl glass">
      <div className="flex items-center gap-1.5 text-[10px] text-vmuted uppercase tracking-wider font-bold mb-1">
        {icon}{label}
      </div>
      <div className={`text-xl font-black ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}

function UploadModal({
  onClose,
  onAdd,
  nextOrder,
}: {
  onClose: () => void;
  onAdd: (reel: FeedReel) => void;
  nextOrder: number;
}) {
  const [titleEn, setTitleEn] = useState('');
  const [titleTa, setTitleTa] = useState('');
  const [caption, setCaption] = useState('');
  const [contentType, setContentType] = useState<FeedContentType>('News');
  const [genre, setGenre] = useState<string>(genres[0]);
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Scheduled'>('Draft');
  const [scheduleDate, setScheduleDate] = useState('');
  const [stripAd, setStripAd] = useState(false);
  const [bannerAfter, setBannerAfter] = useState(false);
  const [attachedCampaign, setAttachedCampaign] = useState('None');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumb, setThumb] = useState('20212135');

  const handleAdd = () => {
    const newReel: FeedReel = {
      id: `r${Date.now()}`,
      title: titleEn || 'Untitled',
      titleTa: titleTa || 'தலைப்பு இல்லை',
      caption: caption || '',
      captionTa: '',
      creator: 'Vallavan News',
      creatorHandle: '@vallavannews',
      contentType,
      genre: genre as FeedReel['genre'],
      duration: '0:30',
      durationSec: 30,
      thumb: thumb || '20212135',
      videoUrl: videoUrl || undefined,
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      status,
      uploaded: new Date().toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' }),
      stripAdHost: stripAd,
      bannerAfter,
      attachedCampaign: attachedCampaign !== 'None' ? attachedCampaign : undefined,
      order: nextOrder,
    };
    onAdd(newReel);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-white">Add New Feed Content</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full glass">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* Video upload */}
          <div className="border-2 border-dashed border-white/15 rounded-xl p-6 flex flex-col items-center">
            <Upload size={24} className="text-vmuted mb-2" />
            <p className="text-sm text-white font-semibold">Upload Video</p>
            <p className="text-xs text-vmuted mt-1">MP4, MOV · max 500MB · vertical 9:16</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Video URL (YouTube / HLS / MP4)</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…" className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
            <div className="mt-2"><DyneTubeUpload onUploaded={setVideoUrl} /></div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Thumbnail URL / Pexels id</label>
            <input value={thumb} onChange={(e) => setThumb(e.target.value)} placeholder="20212135" className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
          </div>

          {/* Title fields */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Title (English)</label>
            <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. Cauvery Delta Crisis" className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Title (Tamil)</label>
            <input value={titleTa} onChange={(e) => setTitleTa(e.target.value)} placeholder="தலைப்பு" className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred font-tamil" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Caption / Description</label>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Brief description..." rows={2} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred resize-none" />
          </div>

          {/* Content type + genre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold flex items-center gap-1"><Tag size={10} /> Content Type</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value as FeedContentType)} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none">
                {contentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Genre Tag</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none">
                {genres.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Publish status */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Publish Status</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['Draft', 'Published', 'Scheduled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition active:scale-95 ${status === s ? 'bg-vred text-white' : 'glass text-vmuted'}`}
                >
                  {s === 'Published' ? 'Publish Now' : s}
                </button>
              ))}
            </div>
            {status === 'Scheduled' && (
              <div className="mt-2 flex items-center gap-2 px-4 py-3 rounded-xl glass">
                <Calendar size={14} className="text-vmuted" />
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none"
                />
              </div>
            )}
          </div>

          {/* Ad placement controls */}
          <div className="p-3 rounded-xl glass space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Ad Placement Controls</div>
            <button onClick={() => setStripAd((v) => !v)} className="w-full flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Strip Ad Host</div>
                <div className="text-[10px] text-vmuted">Eligible for bottom strip ad overlay</div>
              </div>
              {stripAd ? <ToggleRight size={26} className="text-vred" /> : <ToggleLeft size={26} className="text-vmuted" />}
            </button>
            <button onClick={() => setBannerAfter((v) => !v)} className="w-full flex items-center justify-between">
              <div className="text-left">
                <div className="text-sm font-semibold text-white">Banner Ad After This</div>
                <div className="text-[10px] text-vmuted">Pin a sponsored interstitial after this reel</div>
              </div>
              {bannerAfter ? <ToggleRight size={26} className="text-vred" /> : <ToggleLeft size={26} className="text-vmuted" />}
            </button>
            {bannerAfter && (
              <div>
                <label className="text-[10px] uppercase tracking-wider text-vmuted font-bold">Attach Campaign</label>
                <select value={attachedCampaign} onChange={(e) => setAttachedCampaign(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-xl glass text-sm text-white outline-none">
                  <option value="None">No campaign attached</option>
                  {mockCampaigns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-full glass text-white font-bold text-sm active:scale-95 transition">
              Cancel
            </button>
            <button onClick={handleAdd} className="flex-1 py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95 transition">
              {status === 'Published' ? 'Publish Now' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
