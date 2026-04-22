import type { ReactNode } from 'react';

/**
 * Left sidebar — will host Setup (scale), Placement (add screen),
 * Selection (edit current screen), Cabinet planner, Assist in phase 3+.
 * Phase 2 renders sections as placeholder cards so the layout is
 * visible and proportional.
 */
const SidebarLeft = () => {
  return (
    <aside className="flex w-full flex-col gap-2 lg:w-72">
      <Panel title="Масштаб" hint="Фаза 3 — калибровка по 2 точкам">
        <PlaceholderRow label="Длина, м" />
        <PlaceholderRow label="Старт" />
      </Panel>
      <Panel title="Assist" hint="Фаза 4 — полуавтоматический контур">
        <PlaceholderRow label="Анализ" />
        <PlaceholderRow label="Применить" />
      </Panel>
      <Panel title="Экраны" hint="Фаза 3 — 4 клика по углам">
        <PlaceholderRow label="Добавить экран" />
        <PlaceholderRow label="Экспорт отчёта" />
      </Panel>
      <Panel title="Выбранный" hint="Фаза 3 — редактор выделенного экрана">
        <PlaceholderRow label="Ширина, м" />
        <PlaceholderRow label="Высота, м" />
      </Panel>
      <Panel title="Кабинеты 0.5 × 0.5" hint="Фаза 4 — pixel pitch + auto-fill">
        <PlaceholderRow label="Автозаполнение" />
      </Panel>
    </aside>
  );
};

const Panel = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {hint ? <span className="text-[9px] text-slate-600">{hint}</span> : null}
    </div>
    <div className="space-y-1.5">{children}</div>
  </div>
);

const PlaceholderRow = ({ label }: { label: string }) => (
  <div className="rounded-md border border-dashed border-white/10 bg-slate-950/40 px-2 py-1.5 text-[11px] text-slate-500">
    {label}
  </div>
);

export default SidebarLeft;
