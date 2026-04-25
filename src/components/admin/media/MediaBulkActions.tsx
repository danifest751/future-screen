import { useState } from 'react';
import { CheckSquare, Tag, Trash2, X } from 'lucide-react';
import { mediaBulkActionsContent } from '../../../content/components/mediaBulkActions';
import { ConfirmModal } from '../ui';

interface MediaBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  allTags: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onAddTags: (tags: string[]) => void;
  onRemoveTags: (tags: string[]) => void;
  isDeleting?: boolean;
}

export const MediaBulkActions = ({
  selectedCount,
  totalCount,
  allTags,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onAddTags,
  onRemoveTags,
  isDeleting = false,
}: MediaBulkActionsProps) => {
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagMode, setTagMode] = useState<'add' | 'remove'>('add');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  if (selectedCount === 0) return null;

  const handleOpenTagModal = (mode: 'add' | 'remove') => {
    setTagMode(mode);
    setSelectedTags([]);
    setCustomTag('');
    setShowTagModal(true);
  };

  const handleApplyTags = () => {
    const tags = [...selectedTags];
    if (customTag.trim()) {
      tags.push(
        ...customTag
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      );
    }

    if (tags.length > 0) {
      if (tagMode === 'add') {
        onAddTags(tags);
      } else {
        onRemoveTags(tags);
      }
    }

    setShowTagModal(false);
    setSelectedTags([]);
    setCustomTag('');
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const tagDescription = (
    <div className="space-y-4">
      {allTags.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-slate-400">{mediaBulkActionsContent.tagModal.existingPrompt}</p>
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    isSelected ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm text-slate-400">
          {tagMode === 'add' ? mediaBulkActionsContent.tagModal.addPrompt : mediaBulkActionsContent.tagModal.removePrompt}
        </p>
        <input
          type="text"
          value={customTag}
          onChange={(event) => setCustomTag(event.target.value)}
          placeholder={mediaBulkActionsContent.tagModal.inputPlaceholder}
          className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded bg-brand-500/20 px-2 py-1 text-xs text-brand-200">
              {tag}
              <button onClick={() => toggleTag(tag)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <ConfirmModal
        open={showTagModal}
        title={tagMode === 'add' ? mediaBulkActionsContent.tagModal.addTitle : mediaBulkActionsContent.tagModal.removeTitle}
        description={tagDescription}
        confirmText={tagMode === 'add' ? mediaBulkActionsContent.tagModal.addConfirm : mediaBulkActionsContent.tagModal.removeConfirm}
        cancelText={mediaBulkActionsContent.tagModal.cancel}
        onCancel={() => setShowTagModal(false)}
        onConfirm={handleApplyTags}
        confirmDisabled={selectedTags.length === 0 && !customTag.trim()}
      />

      <ConfirmModal
        open={showDeleteModal}
        danger
        title={mediaBulkActionsContent.deleteModal.title}
        description={mediaBulkActionsContent.deleteModal.description(selectedCount)}
        confirmText={mediaBulkActionsContent.deleteModal.confirmText}
        cancelText={mediaBulkActionsContent.deleteModal.cancelText}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteModal(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1.5">
        <span className="text-sm text-brand-200">
          {mediaBulkActionsContent.toolbar.selected(selectedCount, totalCount)}
        </span>

        <div className="mx-2 h-4 w-px bg-brand-500/30" />

        <button
          onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-brand-200 transition-colors hover:bg-brand-500/20"
        >
          <CheckSquare size={14} />
          {selectedCount === totalCount ? mediaBulkActionsContent.toolbar.deselect : mediaBulkActionsContent.toolbar.selectAll}
        </button>

        <div className="mx-2 h-4 w-px bg-brand-500/30" />

        <button
          onClick={() => handleOpenTagModal('add')}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-brand-200 transition-colors hover:bg-brand-500/20"
        >
          <Tag size={14} />
          {mediaBulkActionsContent.toolbar.addTag}
        </button>

        <button
          onClick={() => handleOpenTagModal('remove')}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-brand-200 transition-colors hover:bg-brand-500/20"
        >
          <Tag size={14} className="rotate-45" />
          {mediaBulkActionsContent.toolbar.removeTag}
        </button>

        <div className="mx-2 h-4 w-px bg-brand-500/30" />

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={isDeleting}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 size={14} />
          {isDeleting ? mediaBulkActionsContent.toolbar.deleting : mediaBulkActionsContent.toolbar.delete}
        </button>

        <button
          onClick={onDeselectAll}
          className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <X size={14} />
          {mediaBulkActionsContent.toolbar.deselect}
        </button>
      </div>
    </>
  );
};

export default MediaBulkActions;
