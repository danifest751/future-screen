import type { ReactNode } from 'react';

export interface AdminPageToolbarProps {
  /** Top-left filters/controls (search, key picker, etc.). Wraps. */
  filters?: ReactNode;
  /** Right-aligned action buttons (refresh, export, etc.). */
  actions?: ReactNode;
  /** Secondary row below filters: filter pills, op toggles, counters. */
  secondary?: ReactNode;
  /** Right-side hint shown next to actions (e.g. "100 keys with edits"). */
  hint?: ReactNode;
  className?: string;
}

/**
 * Standardised admin page toolbar wrapper. Most admin list pages had a
 * hand-rolled <div className="rounded-xl border…"> with the same structure
 * (filters left, actions right, optional secondary row of pills). This
 * component keeps the shape consistent across pages so they stop drifting
 * apart visually.
 */
const AdminPageToolbar = ({
  filters,
  actions,
  secondary,
  hint,
  className = '',
}: AdminPageToolbarProps) => (
  <div className={`mb-4 rounded-xl border border-white/10 bg-slate-900/50 p-3 ${className}`}>
    <div className="flex flex-wrap items-end gap-3">
      {filters}
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      {hint && !actions && <div className="ml-auto text-xs text-slate-500">{hint}</div>}
    </div>
    {hint && actions && <div className="mt-2 text-right text-xs text-slate-500">{hint}</div>}
    {secondary && <div className="mt-3">{secondary}</div>}
  </div>
);

export default AdminPageToolbar;
