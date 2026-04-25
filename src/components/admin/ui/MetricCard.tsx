import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  Icon?: LucideIcon;
}

/**
 * Compact stat card for admin dashboards. Single source of truth for the
 * label-value-hint layout that several admin pages reproduced inline.
 */
const MetricCard = ({ label, value, hint, Icon }: MetricCardProps) => (
  <div className="rounded-xl border border-white/10 bg-slate-800 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-medium text-slate-400">{label}</div>
        <div className="mt-1 text-2xl font-bold text-white">{value}</div>
        {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
      </div>
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand-500/20 bg-brand-500/10">
          <Icon size={18} className="text-brand-300" />
        </div>
      )}
    </div>
  </div>
);

export default MetricCard;
