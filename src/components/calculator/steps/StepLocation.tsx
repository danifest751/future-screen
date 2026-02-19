import { locations, type Location } from '../../../data/calculatorConfig';

interface Props {
  value: Location | null;
  onChange: (v: Location) => void;
}

const StepLocation = ({ value, onChange }: Props) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-white">Локация</h2>
    <p className="text-sm text-slate-400">Влияет на яркость, защиту и минимальный шаг пикселя</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {locations.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => onChange(l.value)}
          className={`rounded-xl border px-6 py-4 text-left text-base font-medium transition ${
            value === l.value
              ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg shadow-brand-500/20'
              : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  </div>
);

export default StepLocation;
