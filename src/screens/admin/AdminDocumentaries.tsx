import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Upload, X } from 'lucide-react';
import { adminDocumentaries as mockAdminDocs } from '@/data/mockData';
import { fetchAdminDocumentaries } from '@/services/admin';

export function AdminDocumentaries() {
  const [query, setQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [adminDocumentaries, setAdminDocumentaries] = useState(mockAdminDocs);

  useEffect(() => {
    fetchAdminDocumentaries().then(setAdminDocumentaries);
  }, []);

  const filtered = adminDocumentaries.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    Published: 'text-green-400 bg-green-500/15',
    Draft: 'text-vgold bg-vgold/15',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl glass">
          <Search size={16} className="text-vmuted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentaries..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-vmuted outline-none"
          />
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2.5 rounded-xl bg-vred text-white text-sm font-bold flex items-center gap-2 active:scale-95 transition"
        >
          <Plus size={16} /> Upload New
        </button>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-vmuted">
              <th className="text-left px-4 py-3 font-bold">Title</th>
              <th className="text-left px-4 py-3 font-bold">Genre</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Views</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Uploaded</th>
              <th className="text-left px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-white/5 transition">
                <td className="px-4 py-3 font-semibold text-white">{d.title}</td>
                <td className="px-4 py-3 text-vmuted">{d.genre}</td>
                <td className="px-4 py-3 text-vmuted hidden sm:table-cell">{d.views.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-vmuted hidden md:table-cell">{d.uploaded}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[d.status]}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10">
                    <MoreVertical size={14} className="text-vmuted" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-vblack rounded-2xl border border-white/10 p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-white">Upload New Documentary</h3>
              <button onClick={() => setShowUpload(false)} className="w-8 h-8 flex items-center justify-center rounded-full glass">
                <X size={16} className="text-white" />
              </button>
            </div>
            <div className="space-y-3">
              <input placeholder="Title (English)" className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred" />
              <input placeholder="தலைப்பு (Tamil)" className="w-full px-4 py-3 rounded-xl glass text-sm text-white placeholder:text-vmuted outline-none focus:border-vred font-tamil" />
              <select className="w-full px-4 py-3 rounded-xl glass text-sm text-white outline-none">
                <option>Genre: Environment</option>
                <option>Genre: Wildlife</option>
                <option>Genre: History</option>
                <option>Genre: Science</option>
              </select>
              <div className="border-2 border-dashed border-white/15 rounded-xl p-6 flex flex-col items-center">
                <Upload size={24} className="text-vmuted mb-2" />
                <p className="text-sm text-white font-semibold">Drop video file here</p>
                <p className="text-xs text-vmuted mt-1">MP4, MOV · max 2GB</p>
              </div>
              <button className="w-full py-3 rounded-full bg-vred text-white font-bold text-sm active:scale-95">
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
