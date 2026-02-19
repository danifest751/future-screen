import { purposes, type Purpose } from '../../../data/calculatorConfig';

interface Props {
  value: Purpose | null;
  onChange: (v: Purpose) => void;
}

const StepPurpose = ({ value, onChange }: Props) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-white">Назначение экрана</h2>
    <p className="text-sm text-slate-400">Влияет на шаг пикселя и рекомендуемую высоту</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {purposes.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          className={`rounded-xl border px-4 py-3 text-left transition ${
            value === p.value
              ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg shadow-brand-500/20'
              : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
          }`}
        >
          <div className="text-sm font-medium">{p.label}</div>
          <div className="mt-0.5 text-xs text-slate-500">{p.hint}</div>
        </button>
      ))}
    </div>
  </div>
);

export default StepPurpose;
