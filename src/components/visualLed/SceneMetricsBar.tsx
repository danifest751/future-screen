import { Grid3x3, Monitor, Ruler, Sigma } from 'lucide-react';
import { collectSceneMetrics, type ScreenMetric } from './state/selectors';
import { useActiveScene } from './state/VisualLedContext';

const formatMetric = (value: number | null, digits = 1) => {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(1, digits),
  });
};

const screenSizeLabel = (screen: ScreenMetric) => {
  if (screen.widthM === null || screen.heightM === null) return 'масштаб не задан';
  return `${formatMetric(screen.widthM)} × ${formatMetric(screen.heightM)} м`;
};

const cabinetLabel = (screen: ScreenMetric) => {
  if (screen.cabinetCount === null) return 'кабинеты не заданы';
  return `${screen.cabinetCount} шт · ${screen.cabinetCols}×${screen.cabinetRows}`;
};

const MetricTile = ({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: JSX.Element;
  tone?: 'default' | 'accent';
}) => (
  <div
    className={`rounded-lg border px-3 py-2 ${
      tone === 'accent'
        ? 'border-brand-400/40 bg-brand-500/15'
        : 'border-white/10 bg-slate-950/55'
    }`}
  >
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      {icon}
      {label}
    </div>
    <div className="truncate text-sm font-semibold text-white">{value}</div>
  </div>
);

const ScreenChip = ({ screen }: { screen: ScreenMetric }) => (
  <div
    className={`flex min-w-0 shrink-0 items-center gap-2 rounded-md border px-2 py-1 text-[11px] ${
      screen.selected
        ? 'border-brand-400/60 bg-brand-500/15 text-white'
        : 'border-white/10 bg-slate-950/45 text-slate-300'
    }`}
    title={`${screen.name}: ${screenSizeLabel(screen)}, площадь ${formatMetric(screen.areaM2)} м², ${cabinetLabel(screen)}`}
  >
    <span className="max-w-[8rem] truncate font-semibold">{screen.name}</span>
    <span className="text-slate-500">·</span>
    <span>{formatMetric(screen.areaM2)} м²</span>
    <span className="text-slate-500">·</span>
    <span>{screen.cabinetCount ?? '—'} каб.</span>
  </div>
);

const SceneMetricsBar = () => {
  const scene = useActiveScene();
  const metrics = collectSceneMetrics(scene);
  const selected = metrics.selected;

  if (metrics.screenCount === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2 text-xs text-slate-400">
        Добавь экран — здесь появятся размер, площадь и кабинеты.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-2 shadow-lg shadow-black/15">
      <div className="grid gap-2 md:grid-cols-[minmax(0,1.25fr)_repeat(3,minmax(8rem,0.65fr))]">
        <MetricTile
          label={selected ? `Выбран: ${selected.name}` : 'Выбранный экран'}
          value={
            selected
              ? `${screenSizeLabel(selected)} · ${formatMetric(selected.areaM2)} м²`
              : 'выбери экран'
          }
          icon={<Monitor className="h-3.5 w-3.5" />}
          tone="accent"
        />
        <MetricTile
          label="Кабинеты"
          value={selected ? cabinetLabel(selected) : '—'}
          icon={<Grid3x3 className="h-3.5 w-3.5" />}
        />
        <MetricTile
          label="Всего площадь"
          value={`${formatMetric(metrics.totalAreaM2)} м²`}
          icon={<Ruler className="h-3.5 w-3.5" />}
        />
        <MetricTile
          label="Всего кабинетов"
          value={
            metrics.totalCabinetCount === null
              ? '—'
              : `${metrics.totalCabinetCount} шт · ${metrics.screenCount} экр.`
          }
          icon={<Sigma className="h-3.5 w-3.5" />}
        />
      </div>

      {metrics.screenCount > 1 ? (
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {metrics.screens.map((screen) => (
            <ScreenChip key={screen.id} screen={screen} />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default SceneMetricsBar;
