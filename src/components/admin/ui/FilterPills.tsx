import type { ReactNode } from 'react';

export interface FilterPill<TValue extends string> {
  value: TValue;
  label: ReactNode;
  count?: number;
  icon?: ReactNode;
}

export interface FilterPillsProps<TValue extends string> {
  title?: ReactNode;
  pills: ReadonlyArray<FilterPill<TValue>>;
  /** When omitted, behaves as a multi-select (parent owns logic). */
  active: TValue | TValue[] | null;
  onChange: (value: TValue) => void;
  className?: string;
}

const isActive = <TValue extends string>(active: FilterPillsProps<TValue>['active'], value: TValue): boolean => {
  if (active === null) return false;
  if (Array.isArray(active)) return active.includes(value);
  return active === value;
};

/**
 * Single-row filter chip group used by AdminLeads (quick presets),
 * AdminContentHistory (operation toggles), and MediaLibrary (quick tags).
 * Layout-only: parent decides single vs multi-select semantics.
 */
const FilterPills = <TValue extends string>({
  title,
  pills,
  active,
  onChange,
  className = '',
}: FilterPillsProps<TValue>) => (
  <div className={`flex flex-wrap items-center gap-1.5 text-xs ${className}`}>
    {title && <span className="text-slate-500">{title}:</span>}
    {pills.map((pill) => {
      const pressed = isActive(active, pill.value);
      return (
        <button
          key={pill.value}
          type="button"
          onClick={() => onChange(pill.value)}
          aria-pressed={pressed}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 transition ${
            pressed
              ? 'border-brand-500 bg-brand-500/20 text-white'
              : 'border-white/10 bg-slate-900 text-slate-300 hover:border-white/30 hover:text-white'
          }`}
        >
          {pill.icon}
          {pill.label}
          {pill.count !== undefined && (
            <span className="font-mono text-[10px] text-slate-400">{pill.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default FilterPills;
