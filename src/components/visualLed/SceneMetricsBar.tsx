import { Gauge, Grid3x3, Ruler, Weight, Zap } from 'lucide-react';
import { collectSceneMetrics, type ScreenMetric } from './state/selectors';
import { useActiveScene } from './state/VisualLedContext';

const formatMetric = (value: number | null, digits = 1) => {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(1, digits),
  });
};

const formatPower = (watts: number | null) => {
  if (watts === null || !Number.isFinite(watts)) return '—';
  if (watts >= 1000) return `${formatMetric(watts / 1000, 1)} кВт`;
  return `${Math.round(watts)} Вт`;
};

const formatWeight = (kg: number | null) => {
  if (kg === null || !Number.isFinite(kg)) return '—';
  if (kg >= 1000) return `${formatMetric(kg / 1000, 1)} т`;
  return `${Math.round(kg)} кг`;
};

const formatWeightRange = (minKg: number | null, maxKg: number | null) => {
  if (minKg === null || maxKg === null) return '—';
  if (minKg === maxKg) return formatWeight(minKg);
  if (minKg >= 1000 || maxKg >= 1000) {
    return `${formatMetric(minKg / 1000, 1)}–${formatMetric(maxKg / 1000, 1)} т`;
  }
  return `${Math.round(minKg)}–${Math.round(maxKg)} кг`;
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
  className = '',
}: {
  label: string;
  value: string;
  icon: JSX.Element;
  tone?: 'default' | 'accent';
  className?: string;
}) => (
  <div
    className={`rounded-lg border px-3 py-2 ${
      tone === 'accent'
        ? 'border-brand-400/40 bg-brand-500/15'
        : 'border-white/10 bg-slate-950/55'
    } ${className}`.trim()}
  >
    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      {icon}
      <span className="truncate">{label}</span>
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
    title={`${screen.name}: ${screenSizeLabel(screen)}, площадь ${formatMetric(screen.areaM2)} м², ${cabinetLabel(screen)}, электрика ${formatPower(screen.maxPowerW)}, среднее ${formatPower(screen.averagePowerW)}, вес ${formatWeightRange(screen.weightMinKg, screen.weightMaxKg)}`}
  >
    <span className="max-w-[8rem] truncate font-semibold">{screen.name}</span>
    <span className="text-slate-500">·</span>
    <span>{formatMetric(screen.areaM2)} м²</span>
    <span className="text-slate-500">·</span>
    <span>{screen.cabinetCount ?? '—'} каб.</span>
    <span className="text-slate-500">·</span>
    <span className="flex items-center gap-1">
      <Zap className="h-3 w-3 text-amber-300" />
      {formatPower(screen.maxPowerW)}
    </span>
    <span className="text-slate-500">·</span>
    <span className="flex items-center gap-1">
      <Weight className="h-3 w-3 text-slate-300" />
      {formatWeightRange(screen.weightMinKg, screen.weightMaxKg)}
    </span>
  </div>
);

const SceneMetricsBar = () => {
  const scene = useActiveScene();
  const metrics = collectSceneMetrics(scene);

  if (metrics.screenCount === 0) {
    return (
      <section className="rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2 text-xs text-slate-400">
        Добавь экран — здесь появятся размер, площадь, кабинеты, электрика и вес.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-2 shadow-lg shadow-black/15">
      {/*
        5 aggregate tiles. Per-screen "Selected" tile was removed because
        the chips row below already shows that info — and now it shows
        unconditionally (even with a single screen) so nothing's lost.
      */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
        <MetricTile
          label="Кабинеты"
          value={
            metrics.totalCabinetCount === null
              ? '—'
              : `${metrics.totalCabinetCount} шт`
          }
          icon={<Grid3x3 className="h-3.5 w-3.5" />}
          tone="accent"
        />
        <MetricTile
          label="Всего площадь"
          value={`${formatMetric(metrics.totalAreaM2)} м²`}
          icon={<Ruler className="h-3.5 w-3.5" />}
        />
        {/* Power and weight tiles — desktop and tablet only.
            On phone (<md) these are hidden to keep the bar from
            stacking into multiple cards above the canvas. */}
        <MetricTile
          className="hidden md:block"
          label="Электрика max"
          value={formatPower(metrics.totalMaxPowerW)}
          icon={<Zap className="h-3.5 w-3.5" />}
        />
        <MetricTile
          className="hidden md:block"
          label="Среднее потребление"
          value={formatPower(metrics.totalAveragePowerW)}
          icon={<Gauge className="h-3.5 w-3.5" />}
        />
        <MetricTile
          className="hidden md:block"
          label="Вес экранов"
          value={formatWeightRange(metrics.totalWeightMinKg, metrics.totalWeightMaxKg)}
          icon={<Weight className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Chip row is only useful with multiple screens — with one
          screen it just repeats what the aggregate tiles say. */}
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
