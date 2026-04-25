import type { ReactNode } from 'react';

export interface AdminEditPanelHeaderProps {
  title: string;
  description?: ReactNode;
  /** Banner shown above pills when an autosaved draft was restored. */
  draftHint?: ReactNode;
  /** Right column ribbon labels (source pill, edit-mode pill, isDirty pill). */
  sourceLabel?: string;
  isEditing?: boolean;
  isDirty?: boolean;
  editModeLabel?: string;
  unsavedLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  cancelDisabled?: boolean;
}

/**
 * Header for the right-hand "edit form" panel that 4 admin pages
 * (Categories / Packages / Contacts / Cases) share verbatim. Renders the
 * title + description on the left and a column of status pills + cancel
 * button on the right. Callers own the form below.
 */
const AdminEditPanelHeader = ({
  title,
  description,
  draftHint,
  sourceLabel,
  isEditing = false,
  isDirty = false,
  editModeLabel,
  unsavedLabel,
  cancelLabel,
  onCancel,
  cancelDisabled,
}: AdminEditPanelHeaderProps) => (
  <div className="mb-3 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      {draftHint && <p className="mt-2 text-xs text-amber-200">{draftHint}</p>}
    </div>
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      {sourceLabel && (
        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
          {sourceLabel}
        </span>
      )}
      {isEditing && editModeLabel && (
        <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
          {editModeLabel}
        </span>
      )}
      {isDirty && unsavedLabel && (
        <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
          {unsavedLabel}
        </span>
      )}
      {isEditing && cancelLabel && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelDisabled}
          className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelLabel}
        </button>
      )}
    </div>
  </div>
);

export default AdminEditPanelHeader;
