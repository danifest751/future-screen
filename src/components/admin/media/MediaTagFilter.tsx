import { useState, useMemo } from 'react';
import { X, ChevronDown, Tag } from 'lucide-react';

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
  placeholder = 'Фильтр по тегам',
}: MediaTagFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() => {
    if (!search.trim()) return allTags;
    return allTags.filter((tag) =>
      tag.toLowerCase().includes(search.toLowerCase())
    );
  }, [allTags, search]);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
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
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors
          ${isOpen || selectedTags.length > 0
            ? 'border-brand-500 bg-brand-500/10 text-white'
            : 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/20'
          }
        `}
      >
        <span className="flex items-center gap-2 truncate">
          <Tag size={14} />
          {selectedTags.length > 0 ? (
            <span>
              Выбрано: {selectedTags.length}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Selected Tags Pills */}
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2 py-1 text-xs text-brand-200"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="hover:text-white"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-300"
          >
            Очистить
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-white/10 bg-slate-800 shadow-xl">
            {/* Search */}
            <div className="border-b border-white/10 p-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск тегов..."
                className="w-full rounded border border-white/10 bg-slate-900 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Tags List */}
            <div className="max-h-60 overflow-y-auto p-2">
              {filteredTags.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  {search ? 'Теги не найдены' : 'Нет доступных тегов'}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`
                          flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors
                          ${isSelected
                            ? 'bg-brand-500/20 text-brand-200'
                            : 'text-slate-300 hover:bg-slate-700'
                          }
                        `}
                      >
                        <span>{tag}</span>
                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {allTags.length > 0 && (
              <div className="border-t border-white/10 p-2 text-xs text-slate-500">
                Всего тегов: {allTags.length}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaTagFilter;
