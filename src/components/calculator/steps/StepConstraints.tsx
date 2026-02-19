import { installTypes, type InstallType } from '../../../data/calculatorConfig';

interface Props {
  stageWidth: number | null;
  maxHeight: number | null;
  installType: InstallType;
  onStageWidth: (v: number | null) => void;
  onMaxHeight: (v: number | null) => void;
  onInstallType: (v: InstallType) => void;
}

const StepConstraints = ({ stageWidth, maxHeight, installType, onStageWidth, onMaxHeight, onInstallType }: Props) => (
  <div className="space-y-5">
    <h2 className="text-xl font-bold text-white">Ограничения площадки <span className="text-sm font-normal text-slate-500">(опционально)</span></h2>
    <p className="text-sm text-slate-400">Если знаете — укажите, если нет — пропустите этот шаг</p>

    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm text-slate-200">
        Ширина сцены (м)
        <input
          type="number"
          min={1}
          max={100}
          value={stageWidth ?? ''}
          onChange={(e) => onStageWidth(e.target.value ? Number(e.target.value) : null)}
          placeholder="Не указано"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </label>
      <label className="text-sm text-slate-200">
        Макс. высота (м)
        <input
          type="number"
          min={1}
          max={30}
          value={maxHeight ?? ''}
          onChange={(e) => onMaxHeight(e.target.value ? Number(e.target.value) : null)}
          placeholder="Не указано"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
      </label>
    </div>

    <div>
      <div className="mb-2 text-sm text-slate-200">Способ установки</div>
      <div className="flex flex-wrap gap-3">
        {installTypes.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onInstallType(t.value)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              installType === t.value
                ? 'border-brand-500 bg-brand-500/10 text-white'
                : 'border-white/10 text-slate-300 hover:border-white/25'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default StepConstraints;
