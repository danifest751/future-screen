import { useMemo, useState } from 'react';
import { Check, ChevronDown, Tag, X } from 'lucide-react';
import { mediaTagFilterContent } from '../../../content/components/mediaTagFilter';

interface MediaTagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export const MediaTagFilter = ({
  allTags,
  selectedTags,
  onChange,
  placeholder = mediaTagFilterContent.placeholder,
}: MediaTagFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() => {
    if (!search.trim()) return allTags;
    return allTags.filter((tag) => tag.toLowerCase().includes(search.toLowerCase()));
  }, [allTags, search]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((item) => item !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearch('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm transition active:scale-[0.98] ${
          isOpen || selectedTags.length > 0
            ? 'border-emerald-500/40 bg-emerald-500/10 text-white'
            : 'border-white/10 bg-slate-950 text-slate-300 hover:border-white/20'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <Tag size={14} />
          {selectedTags.length > 0 ? <span>{mediaTagFilterContent.selected(selectedTags.length)}</span> : placeholder}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {selectedTags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-100">
              {tag}
              <button onClick={() => toggleTag(tag)} className="hover:text-white">
                <X size={12} />
              </button>
            </span>
          ))}
          <button onClick={clearAll} className="text-xs text-slate-500 hover:text-slate-300">
            {mediaTagFilterContent.clear}
          </button>
        </div>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
            <div className="border-b border-white/10 p-2">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={mediaTagFilterContent.searchPlaceholder}
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/70 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-2">
              {filteredTags.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  {search ? mediaTagFilterContent.notFound : mediaTagFilterContent.empty}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm transition active:scale-[0.99] ${
                          isSelected ? 'bg-emerald-500/15 text-emerald-100' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{tag}</span>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="border-t border-white/10 p-2 text-xs text-slate-500">
                {mediaTagFilterContent.total(allTags.length)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaTagFilter;
