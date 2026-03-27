import { useMemo, useState } from 'react';
import type { CalcInputs, EventType, Location, Purpose, InstallType } from '../../data/calculatorConfig';
import { calculate, estimateDistance } from '../../utils/screenMath';
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig';
import StepEventType from './steps/StepEventType';
import StepLocation from './steps/StepLocation';
import StepAudience from './steps/StepAudience';
import StepDistance from './steps/StepDistance';
import StepPurpose from './steps/StepPurpose';
import StepConstraints from './steps/StepConstraints';
import LeadForm from './LeadForm/LeadForm';

const STEP_LABELS = [
  'Тип мероприятия',
  'Локация',
  'Зрители',
  'Дистанция',
  'Назначение',
  'Площадка',
  'Результат',
];

const Calculator = () => {
  const { config } = useCalculatorConfig();
  const pitchOptions = config.pitchOptions;

  const [step, setStep] = useState(0);
  const [showLead, setShowLead] = useState(false);

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [audience, setAudience] = useState(200);
  const [distanceKnown, setDistanceKnown] = useState(false);
  const [distance, setDistance] = useState(0);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [stageWidth, setStageWidth] = useState<number | null>(null);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [installType, setInstallType] = useState<InstallType>('unknown');

  const canNext = (() => {
    switch (step) {
      case 0: return !!eventType;
      case 1: return !!location;
      case 2: return audience > 0;
      case 3: return distanceKnown ? distance > 0 : true;
      case 4: return !!purpose;
      case 5: return true; // опционально
      default: return false;
    }
  })();

  const inputs: CalcInputs = useMemo(() => ({
    eventType: eventType ?? 'conference',
    location: location ?? 'indoor',
    audience,
    distanceKnown,
    distance: distanceKnown ? distance : estimateDistance(audience),
    purpose: purpose ?? 'video',
    stageWidth,
    maxHeight,
    installType,
  }), [eventType, location, audience, distanceKnown, distance, purpose, stageWidth, maxHeight, installType]);

  const result = useMemo(() => calculate(inputs, pitchOptions), [inputs, pitchOptions]);

  const isResult = step === 6;

  const next = () => {
    if (canNext && step < 6) setStep((s) => s + 1);
  };

  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const reset = () => {
    setStep(0);
    setEventType(null);
    setLocation(null);
    setAudience(200);
    setDistanceKnown(false);
    setDistance(0);
    setPurpose(null);
    setStageWidth(null);
    setMaxHeight(null);
    setInstallType('unknown');
    setShowLead(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  i < step ? 'bg-brand-500' : i === step ? 'bg-brand-400' : 'bg-white/10'
                }`}
              />
              <div className={`mt-1 hidden text-[10px] sm:block ${i <= step ? 'text-slate-300' : 'text-slate-600'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs text-slate-500 sm:hidden">
          Шаг {step + 1} из {STEP_LABELS.length}: {STEP_LABELS[step]}
        </div>
      </div>

      {/* Контент шага */}
      <div className="min-h-[280px]">
        {step === 0 && <StepEventType value={eventType} onChange={(v) => { setEventType(v); next(); }} />}
        {step === 1 && <StepLocation value={location} onChange={(v) => { setLocation(v); next(); }} />}
        {step === 2 && <StepAudience value={audience} onChange={setAudience} />}
        {step === 3 && (
          <StepDistance
            distanceKnown={distanceKnown}
            distance={distance}
            audience={audience}
            onChangeKnown={setDistanceKnown}
            onChangeDistance={setDistance}
          />
        )}
        {step === 4 && <StepPurpose value={purpose} onChange={(v) => { setPurpose(v); next(); }} />}
        {step === 5 && (
          <StepConstraints
            stageWidth={stageWidth}
            maxHeight={maxHeight}
            installType={installType}
            onStageWidth={setStageWidth}
            onMaxHeight={setMaxHeight}
            onInstallType={setInstallType}
          />
        )}
        {isResult && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Рекомендация</h2>
              <p className="text-sm text-slate-400">На основе ваших параметров</p>
            </div>

            {/* Карточки результата */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-500">Размер экрана</div>
                <div className="mt-1 text-2xl font-bold text-white">{result.width} × {result.height} м</div>
                <div className="text-sm text-slate-400">Площадь: {result.area} м²</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-500">Шаг пикселя</div>
                <div className="mt-1 text-2xl font-bold text-brand-400">{result.pitch.label}</div>
                <div className="text-sm text-slate-400">{result.pitch.description}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-500">Установка</div>
                <div className="mt-1 text-lg font-semibold text-white">{result.installRecommendation}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-500">Дистанция</div>
                <div className="mt-1 text-lg font-semibold text-white">{result.distance} м</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-500">Питание (среднее)</div>
                <div className="mt-1 text-lg font-semibold text-white">{result.powerAvg}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-slate-500">Питание (пик)</div>
                <div className="mt-1 text-lg font-semibold text-white">{result.powerPeak}</div>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-200">
                    ⚠️ {w}
                  </div>
                ))}
              </div>
            )}

            {result.explanations.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-semibold text-slate-300">Почему так:</div>
                {result.explanations.map((e, i) => (
                  <p key={i} className="text-sm text-slate-400">• {e}</p>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowLead(true)}
              className="w-full rounded-xl bg-brand-500 px-6 py-4 text-center text-lg font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
            >
              Получить КП за 15 минут
            </button>
          </div>
        )}
      </div>

      {/* Навигация */}
      {!isResult && (
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white disabled:opacity-30"
          >
            ← Назад
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400 disabled:opacity-40"
          >
            {step === 5 ? 'Рассчитать →' : 'Далее →'}
          </button>
        </div>
      )}

      {isResult && (
        <div className="mt-6 text-center">
          <button type="button" onClick={reset} className="text-sm text-slate-400 hover:text-white">
            ← Начать заново
          </button>
        </div>
      )}

      <LeadForm inputs={inputs} result={result} open={showLead} onClose={() => setShowLead(false)} />
    </div>
  );
};

export default Calculator;
