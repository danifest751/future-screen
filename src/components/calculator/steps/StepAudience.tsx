import { useState } from 'react';
import { audiencePresets } from '../../../data/calculatorConfig';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const StepAudience = ({ value, onChange }: Props) => {
  const [custom, setCustom] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Количество зрителей</h2>
      <p className="text-sm text-slate-400">Помогает оценить дистанцию и размер экрана</p>

      {!custom && (
        <div className="grid gap-3 sm:grid-cols-2">
          {audiencePresets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                value === p.value
                  ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg shadow-brand-500/20'
                  : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setCustom((v) => !v)}
        className="text-sm text-brand-400 hover:text-brand-300"
      >
        {custom ? 'Выбрать из пресетов' : 'Ввести точное число'}
      </button>

      {custom && (
        <input
          type="number"
          min={10}
          max={100000}
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="Количество зрителей"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
        />
      )}
    </div>
  );
};

export default StepAudience;
