import { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

export interface AdminCrudToastCopy {
  created: string;
  updated: string;
  saveError: string;
  deleted: string;
  deleteError: string;
  resetSuccess: string;
}

export interface UseAdminCrudHandlersArgs<TPayload, TFormValues, TItem, TId extends string | number = string | number> {
  /** Editing state owned by the page; the hook reads it but does not own it. */
  editingId: TId | null;
  setEditingId: (id: TId | null) => void;
  /** Item targeted for deletion (typically a confirm modal selection). */
  deleteTarget: TItem | null;
  /** Clear the deleteTarget after a successful delete (so the modal closes
   *  and a second confirm-click cannot fire a no-op DELETE). */
  setDeleteTarget?: (target: TItem | null) => void;
  /** Build the persistence payload from form values (id-trimming, splitList, etc.). */
  buildPayload: (values: TFormValues) => TPayload;
  /** CRUD adapters, usually wrappers around the React Query mutations. */
  upsert: (payload: TPayload) => Promise<boolean> | boolean;
  remove: (id: TId) => Promise<boolean> | boolean;
  resetToDefault: () => Promise<unknown> | unknown;
  /** react-hook-form `reset` and the page's defaults to flush back to. */
  reset: (values: TFormValues) => void;
  defaultValues: TFormValues;
  /** Owner clears its persisted draft (useFormDraftPersistence). */
  clearDraft: () => void;
  /** Locale-aware toast copy (so the hook stays i18n-agnostic). */
  toastCopy: AdminCrudToastCopy;
  /** Used as `(target as { id }).id` when deleting. Defaults to `'id'`. */
  deleteIdField?: keyof TItem & string;
}

export interface AdminCrudHandlers<TFormValues> {
  onSubmit: (values: TFormValues) => Promise<void>;
  cancelEdit: () => void;
  handleDelete: () => Promise<void>;
  handleResetDefaults: () => Promise<void>;
}

/**
 * Bundle of the four CRUD handlers that AdminCategories / AdminPackages
 * (and similar list+form pages) implement byte-for-byte identically.
 *
 * The page still owns:
 *   - form state (react-hook-form),
 *   - draft persistence (useFormDraftPersistence),
 *   - hooks for fetching/mutations,
 *   - editingId + deleteTarget UI state.
 *
 * The hook owns the "what to do after the mutation succeeds" plumbing so
 * the toast-text-and-form-reset triplet stays consistent across pages.
 */
export function useAdminCrudHandlers<TPayload, TFormValues, TItem, TId extends string | number = string | number>({
  editingId,
  setEditingId,
  deleteTarget,
  setDeleteTarget,
  buildPayload,
  upsert,
  remove,
  resetToDefault,
  reset,
  defaultValues,
  clearDraft,
  toastCopy,
  deleteIdField = 'id' as keyof TItem & string,
}: UseAdminCrudHandlersArgs<TPayload, TFormValues, TItem, TId>): AdminCrudHandlers<TFormValues> {
  const onSubmit = useCallback(
    async (values: TFormValues) => {
      const payload = buildPayload(values);
      const ok = await upsert(payload);
      if (!ok) {
        toast.error(toastCopy.saveError);
        return;
      }
      toast.success(editingId ? toastCopy.updated : toastCopy.created);
      setEditingId(null);
      reset(defaultValues);
      clearDraft();
    },
    [
      buildPayload,
      clearDraft,
      defaultValues,
      editingId,
      reset,
      setEditingId,
      toastCopy.created,
      toastCopy.saveError,
      toastCopy.updated,
      upsert,
    ],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    reset(defaultValues);
    clearDraft();
  }, [clearDraft, defaultValues, reset, setEditingId]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = (deleteTarget as Record<string, unknown>)[deleteIdField] as TId;
    const ok = await remove(id);
    if (ok) {
      toast.success(toastCopy.deleted);
      // Close the confirm modal — without this the modal stays open and
      // a second click fires DELETE on an already-deleted row, surfacing
      // a misleading "delete error".
      setDeleteTarget?.(null);
    } else {
      toast.error(toastCopy.deleteError);
    }
  }, [deleteIdField, deleteTarget, remove, setDeleteTarget, toastCopy.deleteError, toastCopy.deleted]);

  const handleResetDefaults = useCallback(async () => {
    await resetToDefault();
    toast.success(toastCopy.resetSuccess);
    clearDraft();
  }, [clearDraft, resetToDefault, toastCopy.resetSuccess]);

  return useMemo(
    () => ({ onSubmit, cancelEdit, handleDelete, handleResetDefaults }),
    [onSubmit, cancelEdit, handleDelete, handleResetDefaults],
  );
}
