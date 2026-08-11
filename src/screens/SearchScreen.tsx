import { useState } from 'react';
import { Search, Mic, SlidersHorizontal, X, TrendingUp, Clock } from 'lucide-react';
import { ContentCard } from '@/components/ContentCard';
import { Chip } from '@/components/ui';
import {
  recentSearches, trendingSearches, documentaries, genres,
  type Documentary,
} from '@/data/mockData';

export function SearchScreen({
  onBack,
  onCardClick,
}: {
  onBack: () => void;
  onCardClick: (d: Documentary) => void;
}) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeLang, setActiveLang] = useState('All');

  const results = query.length > 0
    ? documentaries.filter((d) =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.titleTa.includes(query) ||
        d.genre.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-vblack flex flex-col safe-top">
      {/* Search bar */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-white/5 max-w-[900px] mx-auto w-full">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full glass active:scale-90">
            <X size={18} className="text-white" />
          </button>
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full glass">
            <Search size={16} className="text-vmuted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documentaries, genres..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-vmuted outline-none"
            />
            <button className="active:scale-90">
              <Mic size={16} className="text-vgold" />
            </button>
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`w-9 h-9 flex items-center justify-center rounded-full active:scale-90 ${showFilters ? 'bg-vred' : 'glass'}`}
          >
            <SlidersHorizontal size={16} className={showFilters ? 'text-white' : 'text-vmuted'} />
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 animate-slide-up space-y-3">
            <div>
              <div className="text-[9px] tracking-wider uppercase text-vmuted font-bold mb-1.5">Genre</div>
              <div className="flex flex-wrap gap-1.5">
                <Chip label="All" active={activeGenre === 'All'} onClick={() => setActiveGenre('All')} />
                {genres.map((g) => (
                  <Chip key={g} label={g} active={activeGenre === g} onClick={() => setActiveGenre(g)} />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-[9px] tracking-wider uppercase text-vmuted font-bold mb-1.5">Language</div>
                <div className="flex gap-1.5">
                  <Chip label="All" active={activeLang === 'All'} onClick={() => setActiveLang('All')} />
                  <Chip label="Tamil" active={activeLang === 'Tamil'} onClick={() => setActiveLang('Tamil')} />
                  <Chip label="English" active={activeLang === 'English'} onClick={() => setActiveLang('English')} />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <select className="flex-1 px-3 py-2 rounded-xl glass text-xs text-white outline-none">
                <option>Any Duration</option>
                <option>Under 20 min</option>
                <option>20-40 min</option>
                <option>Over 40 min</option>
              </select>
              <select className="flex-1 px-3 py-2 rounded-xl glass text-xs text-white outline-none">
                <option>Any Year</option>
                <option>2024</option>
                <option>2023</option>
                <option>Older</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto max-w-[900px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {query.length === 0 ? (
          <div className="px-4 py-4">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <section className="mb-6">
                <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 flex items-center gap-1.5">
                  <Clock size={12} /> Recent Searches
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="w-full flex items-center gap-3 py-2.5 active:scale-95 transition text-left"
                    >
                      <Clock size={14} className="text-vmuted" />
                      <span className="text-sm text-white">{s}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Trending searches */}
            <section>
              <h3 className="text-[10px] tracking-wider uppercase text-vmuted font-bold mb-2.5 flex items-center gap-1.5">
                <TrendingUp size={12} /> Trending Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-3 py-2 rounded-full glass text-xs font-semibold text-white active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : results.length > 0 ? (
          <div className="px-4 py-4">
            <p className="text-xs text-vmuted mb-3">{results.length} results for "{query}"</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {results.map((d) => (
                <div key={d.id} className="w-full">
                  <ContentCard item={d} onClick={() => onCardClick(d)} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Search size={32} className="text-vmuted mb-3" />
            <p className="text-sm font-semibold text-white">No results found</p>
            <p className="text-xs text-vmuted mt-1">Try a different keyword or genre</p>
          </div>
        )}
      </div>
    </div>
  );
}
