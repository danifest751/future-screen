import { estimateDistance } from '../../../utils/screenMath';

interface Props {
  distanceKnown: boolean;
  distance: number;
  audience: number;
  onChangeKnown: (v: boolean) => void;
  onChangeDistance: (v: number) => void;
}

const StepDistance = ({ distanceKnown, distance, audience, onChangeKnown, onChangeDistance }: Props) => {
  const estimated = Math.round(estimateDistance(audience));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Дистанция до последнего ряда</h2>
      <p className="text-sm text-slate-400">Определяет шаг пикселя и высоту экрана</p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChangeKnown(true)}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
            distanceKnown
              ? 'border-brand-500 bg-brand-500/10 text-white'
              : 'border-white/10 text-slate-300 hover:border-white/25'
          }`}
        >
          Знаю расстояние
        </button>
        <button
          type="button"
          onClick={() => { onChangeKnown(false); onChangeDistance(estimated); }}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
            !distanceKnown
              ? 'border-brand-500 bg-brand-500/10 text-white'
              : 'border-white/10 text-slate-300 hover:border-white/25'
          }`}
        >
          Не знаю
        </button>
      </div>

      {distanceKnown ? (
        <div>
          <input
            type="number"
            min={2}
            max={200}
            value={distance || ''}
            onChange={(e) => onChangeDistance(Number(e.target.value) || 0)}
            placeholder="Расстояние в метрах"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">От экрана до самого дальнего зрителя</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300">
            Оценка по количеству зрителей: <span className="font-semibold text-white">~{estimated} м</span>
          </p>
          <input
            type="range"
            min={Math.round(estimated * 0.5)}
            max={Math.round(estimated * 1.5)}
            value={distance || estimated}
            onChange={(e) => onChangeDistance(Number(e.target.value))}
            className="mt-3 w-full accent-brand-500"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Ближе ({Math.round(estimated * 0.5)} м)</span>
            <span className="font-medium text-white">{distance || estimated} м</span>
            <span>Дальше ({Math.round(estimated * 1.5)} м)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepDistance;
