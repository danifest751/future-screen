import { eventTypes, type EventType } from '../../../data/calculatorConfig';

interface Props {
  value: EventType | null;
  onChange: (v: EventType) => void;
}

const StepEventType = ({ value, onChange }: Props) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-white">Тип мероприятия</h2>
    <p className="text-sm text-slate-400">Выберите формат — это влияет на соотношение сторон и приоритеты экрана</p>
    <div className="grid gap-3 sm:grid-cols-2">
      {eventTypes.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
            value === t.value
              ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg shadow-brand-500/20'
              : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  </div>
);

export default StepEventType;
