import { useState, useMemo, useEffect } from 'react';
import { type CalcResult, type PitchOption, type ScreenSizePreset, type ScreenProduct, type CostParams, type Location } from '../../../data/calculatorConfig';
import { estimatePower } from '../../../utils/screenMath';
import StageViz from './StageViz';
import VisibilityViz from './VisibilityViz';

interface Props {
  result: CalcResult;
  location: Location;
  pitchOptions: PitchOption[];
  sizePresets?: ScreenSizePreset[];
  screenProducts: ScreenProduct[];
  costParams: CostParams;
  rentalDays: number;
  onChangeDays: (n: number) => void;
  onRequestKP: () => void;
}

const ResultCard = ({ result, location, onRequestKP, pitchOptions, sizePresets = [], screenProducts, costParams, rentalDays, onChangeDays }: Props) => {
  const [adjWidth, setAdjWidth] = useState(result.width);
  const [adjHeight, setAdjHeight] = useState(result.height);
  const [adjDistance, setAdjDistance] = useState(result.distance);
  const [adjPitchIdx, setAdjPitchIdx] = useState(
    Math.max(0, pitchOptions.findIndex((p) => p.value === result.pitch.value))
  );

  useEffect(() => {
    setAdjWidth(result.width);
    setAdjHeight(result.height);
    setAdjDistance(result.distance);
    setAdjPitchIdx(Math.max(0, pitchOptions.findIndex((p) => p.value === result.pitch.value)));
  }, [result.width, result.height, result.distance, result.pitch.value, pitchOptions]);

  const adjPitch = pitchOptions[adjPitchIdx] ?? pitchOptions[0] ?? result.pitch;
  const adjArea = Math.round(adjWidth * adjHeight * 10) / 10;
  const adjPower = useMemo(() => estimatePower(adjArea), [adjArea]);

  // подобрать продукт по ближайшему pitch и локации
  const matchedProduct = useMemo(() => {
    const sameLoc = screenProducts.filter((p) => p.location === location);
    const pool = sameLoc.length ? sameLoc : screenProducts;
    const sorted = [...pool].sort((a, b) => Math.abs(a.pitch - adjPitch.value) - Math.abs(b.pitch - adjPitch.value));
    return sorted[0];
  }, [screenProducts, adjPitch.value, location]);

  const productPrice = matchedProduct?.pricePerM2 ?? 0;
  const assembly = costParams.assemblyCostPerM2 * adjArea;
  const dailyBase = productPrice * adjArea;
  const days = Math.max(1, rentalDays);
  const lastFactor = costParams.discountFactors[costParams.discountFactors.length - 1] ?? 1;
  const dayFactors = Array.from({ length: days }, (_, i) => costParams.discountFactors[i] ?? lastFactor);
  const rentTotal = dayFactors.reduce((sum, f) => sum + dailyBase * f, 0);
  const staffPerDay = costParams.technicianPerDay + costParams.engineerPerDay;
  const staffTotal = staffPerDay * days;
  const total = rentTotal + assembly + staffTotal;

  const isModified =
    adjWidth !== result.width ||
    adjHeight !== result.height ||
    adjDistance !== result.distance ||
    adjPitch.value !== result.pitch.value;

  const adjWarnings: string[] = [];
  if (adjDistance < adjPitch.value * 1.2) {
    adjWarnings.push(`При дистанции ${adjDistance} м и шаге ${adjPitch.label} могут быть видны пиксели`);
  }
  if (adjDistance > 0 && adjHeight > 0 && adjDistance / adjHeight < 4) {
    adjWarnings.push('Экран очень высокий для данной дистанции — зрителям в первых рядах будет неудобно');
  }

  const adjExplanations: string[] = [
    `Высота ${adjHeight} м подобрана по дистанции ${adjDistance} м (${adjDistance} м ÷ ${Math.round(adjDistance / adjHeight)})`,
    `Ширина ${adjWidth} м — соотношение сторон ${(adjWidth / adjHeight).toFixed(1)}:1`,
    `Шаг пикселя ${adjPitch.label} для комфортного просмотра с ${adjDistance} м`,
  ];

  const resetAdj = () => {
    setAdjWidth(result.width);
    setAdjHeight(result.height);
    setAdjDistance(result.distance);
    setAdjPitchIdx(pitchOptions.findIndex((p) => p.value === result.pitch.value));
  };

  const vizResult: CalcResult = {
    ...result,
    width: adjWidth,
    height: adjHeight,
    distance: adjDistance,
    area: adjArea,
    pitch: adjPitch,
    powerAvg: adjPower.avg,
    powerPeak: adjPower.peak,
    warnings: adjWarnings,
    explanations: adjExplanations,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Рекомендация</h2>
        <p className="text-sm text-slate-400">На основе ваших параметров</p>
      </div>

      {/* Ползунки подстройки — сразу после заголовка */}
      <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-white">Параметры</div>
            <div className="text-xs text-slate-400">Двигайте ползунки — всё пересчитается мгновенно</div>
          </div>
          {isModified && (
            <button type="button" onClick={resetAdj} className="rounded-lg border border-white/15 px-3 py-1 text-xs text-slate-300 hover:text-white">
              Сбросить
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Ширина</span>
              <span className="font-semibold text-white">{adjWidth} м</span>
            </div>
            <input
              type="range" min={1} max={Math.max(30, result.width * 2)} step={0.5}
              value={adjWidth}
              onChange={(e) => setAdjWidth(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Высота</span>
              <span className="font-semibold text-white">{adjHeight} м</span>
            </div>
            <input
              type="range" min={0.5} max={Math.max(12, result.height * 2)} step={0.5}
              value={adjHeight}
              onChange={(e) => setAdjHeight(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Дистанция</span>
              <span className="font-semibold text-white">{adjDistance} м</span>
            </div>
            <input
              type="range" min={2} max={Math.max(100, result.distance * 2)} step={1}
              value={adjDistance}
              onChange={(e) => setAdjDistance(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">Шаг пикселя</span>
              <span className="font-semibold text-brand-400">{adjPitch.label}</span>
            </div>
            <input
              type="range" min={0} max={pitchOptions.length - 1} step={1}
              value={adjPitchIdx}
              onChange={(e) => setAdjPitchIdx(Number(e.target.value))}
              className="mt-1 w-full accent-brand-500"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-slate-600">
              {pitchOptions.map((p) => (
                <span key={p.value} className={p.value === adjPitch.value ? 'text-brand-400 font-semibold' : ''}>
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {sizePresets.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="text-slate-400">Пресеты размеров:</span>
            {sizePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => { setAdjWidth(preset.width); setAdjHeight(preset.height); }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 hover:border-white/30 hover:text-white"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Карточки результата — всё привязано к vizResult */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-500">Размер экрана</div>
          <div className="mt-1 text-2xl font-bold text-white">{vizResult.width} × {vizResult.height} м</div>
          <div className="text-sm text-slate-400">Площадь: {vizResult.area} м²</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-500">Шаг пикселя</div>
          <div className="mt-1 text-2xl font-bold text-brand-400">{vizResult.pitch.label}</div>
          <div className="text-sm text-slate-400">{vizResult.pitch.description}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-500">Установка</div>
          <div className="mt-1 text-lg font-semibold text-white">{vizResult.installRecommendation}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-500">Дистанция</div>
          <div className="mt-1 text-lg font-semibold text-white">{vizResult.distance} м</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-500">Питание (среднее)</div>
          <div className="mt-1 text-lg font-semibold text-white">{vizResult.powerAvg}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-500">Питание (пик)</div>
          <div className="mt-1 text-lg font-semibold text-white">{vizResult.powerPeak}</div>
        </div>
      </div>

      {vizResult.warnings.length > 0 && (
        <div className="space-y-2">
          {vizResult.warnings.map((w, i) => (
            <div key={i} className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-200">
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {vizResult.explanations.length > 0 && (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-300">Почему так:</div>
          {vizResult.explanations.map((e, i) => (
            <p key={i} className="text-sm text-slate-400">• {e}</p>
          ))}
        </div>
      )}

      {/* Визуализации — используют подстроенные значения */}
      <div className="grid gap-4 md:grid-cols-2">
        <StageViz result={vizResult} />
        <VisibilityViz result={vizResult} />
      </div>

      {/* Стоимость */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
        <div className="text-lg font-bold text-white">Стоимость</div>

        {/* Дни аренды */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">Дней аренды:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeDays(Math.max(1, days - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white hover:border-white/30"
            >−</button>
            <span className="w-10 text-center text-lg font-bold text-white">{days}</span>
            <button
              type="button"
              onClick={() => onChangeDays(days + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white hover:border-white/30"
            >+</button>
          </div>
          {days > 1 && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">
              ср. скидка {Math.round((1 - dayFactors.reduce((s, f) => s + f, 0) / days) * 100)}%
            </span>
          )}
        </div>

        {matchedProduct && (
          <div className="text-xs text-slate-400">
            Экран: {matchedProduct.label} · {matchedProduct.pricePerM2.toLocaleString('ru')} ₽/м² · {matchedProduct.powerWPerM2} Вт/м²
            {matchedProduct.availableArea != null && ` · в наличии ${matchedProduct.availableArea} м²`}
          </div>
        )}

        {matchedProduct?.availableArea != null && adjArea > matchedProduct.availableArea && (
          <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5 text-xs text-yellow-200">
            ⚠️ Требуется {adjArea} м², в наличии {matchedProduct.availableArea} м² — уточните наличие
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Аренда экрана ({adjArea} м² × {productPrice.toLocaleString('ru')} ₽ × {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'})</span>
            <span className="font-semibold text-white">{Math.round(rentTotal).toLocaleString('ru')} ₽</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Сборка/монтаж ({adjArea} м² × {costParams.assemblyCostPerM2.toLocaleString('ru')} ₽)</span>
            <span className="font-semibold text-white">{Math.round(assembly).toLocaleString('ru')} ₽</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Персонал на {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</span>
            <span className="font-semibold text-white">{Math.round(staffTotal).toLocaleString('ru')} ₽</span>
          </div>
          <div className="ml-4 space-y-0.5 text-xs text-slate-400">
            <div>• Техник — {costParams.technicianPerDay.toLocaleString('ru')} ₽/день × {days} = {(costParams.technicianPerDay * days).toLocaleString('ru')} ₽</div>
            <div>• Инженер — {costParams.engineerPerDay.toLocaleString('ru')} ₽/день × {days} = {(costParams.engineerPerDay * days).toLocaleString('ru')} ₽</div>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="text-base font-bold text-white">Итого</span>
            <span className="text-base font-bold text-emerald-400">{Math.round(total).toLocaleString('ru')} ₽</span>
          </div>
        </div>

        {days > 1 && (
          <div className="text-xs text-slate-400">
            Скидки по дням: {costParams.discountFactors.map((f, i) => `${i + 1}-й день — ${Math.round(f * 100)}%`).join(', ')}
            {days > costParams.discountFactors.length && `, ${costParams.discountFactors.length + 1}+ день — ${Math.round((costParams.discountFactors[costParams.discountFactors.length - 1] ?? 1) * 100)}%`}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold text-white">Что входит</div>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          <li>• Доставка и монтаж (сборка)</li>
          <li>• Процессинг и плейаут</li>
          <li>• 2 человека на объекте: техник + инженер</li>
          <li>• Резерв по запросу</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onRequestKP}
        className="w-full rounded-xl bg-brand-500 px-6 py-4 text-center text-lg font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
      >
        Получить КП за 15 минут
      </button>
    </div>
  );
};

export default ResultCard;
