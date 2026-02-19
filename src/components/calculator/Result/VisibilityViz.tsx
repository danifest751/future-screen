import type { CalcResult } from '../../../data/calculatorConfig';

interface Props {
  result: CalcResult;
}

const VisibilityViz = ({ result }: Props) => {
  const { pitch, distance } = result;

  // Комфортная дистанция ≈ pitch(mm) в метрах. Ratio < 1 = хорошо, > 1 = пиксели видны
  const comfortRatio = pitch.value / distance;

  // blur только когда pitch реально слишком крупный для дистанции
  // ratio > 1 означает «зритель ближе минимальной комфортной дистанции»
  const blurPx = comfortRatio > 1 ? Math.min((comfortRatio - 1) * 3, 3) : 0;

  // Сетка видна только при ratio > 0.6 (зритель достаточно близко к экрану)
  const gridOpacity = comfortRatio > 0.6 ? Math.min((comfortRatio - 0.6) * 0.5, 0.3) : 0;
  const gridSize = Math.max(4, pitch.value * 2);

  // Оценка качества
  let quality: { label: string; color: string; bg: string };
  if (comfortRatio <= 0.5) {
    quality = { label: 'Отлично — пиксели не видны, текст чёткий', color: 'text-emerald-400', bg: 'border-emerald-500/30' };
  } else if (comfortRatio <= 0.8) {
    quality = { label: 'Хорошо — комфортный просмотр', color: 'text-emerald-300', bg: 'border-emerald-500/20' };
  } else if (comfortRatio <= 1.2) {
    quality = { label: 'Нормально — мелкий текст может быть нечётким', color: 'text-yellow-300', bg: 'border-yellow-500/20' };
  } else if (comfortRatio <= 1.8) {
    quality = { label: 'Заметно — пиксельная структура видна', color: 'text-orange-300', bg: 'border-orange-500/20' };
  } else {
    quality = { label: 'Плохо — пиксели явно видны, нужен мельче шаг', color: 'text-red-400', bg: 'border-red-500/20' };
  }

  return (
    <div className={`rounded-xl border bg-white/5 p-4 ${quality.bg}`}>
      <div className="mb-1 text-sm font-semibold text-white">Как будет видно</div>
      <div className={`mb-3 text-xs font-medium ${quality.color}`}>{quality.label}</div>

      <div className="relative overflow-hidden rounded-lg bg-slate-800" style={{ height: 160 }}>
        {/* Контент-превью */}
        <div
          className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center transition-all duration-300"
          style={{ filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none' }}
        >
          <div className="text-xl font-bold text-white leading-tight">Заголовок слайда</div>
          <div className="text-sm text-slate-200">Подзаголовок с важной информацией</div>
          <div className="text-xs text-slate-400">Мелкий текст · 12pt · для проверки читаемости</div>
          <div className="mt-1 flex gap-3">
            <div className="h-6 w-16 rounded bg-brand-500/60" />
            <div className="h-6 w-16 rounded bg-emerald-500/60" />
          </div>
        </div>

        {/* Пиксельная сетка */}
        {gridOpacity > 0 && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              opacity: gridOpacity,
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.6) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.6) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`,
            }}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{pitch.label} · {distance} м</span>
        <span>Визуальная оценка</span>
      </div>
    </div>
  );
};

export default VisibilityViz;
