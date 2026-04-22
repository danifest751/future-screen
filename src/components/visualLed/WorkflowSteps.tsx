import { Check } from 'lucide-react';
import { useActiveScene } from './state/VisualLedContext';

/**
 * Compact workflow strip that guides a first-time user through the
 * correct order of operations. Each stage lights up green when its
 * condition is met; dimmed otherwise.
 */
const WorkflowSteps = () => {
  const scene = useActiveScene();

  const hasBackground = Boolean(scene.activeBackgroundId);
  const hasScale = Boolean(scene.scaleCalib);
  const hasScreen = scene.elements.length > 0;
  const hasCabinet = scene.elements.some((el) => el.cabinetPlan);
  const allDone = hasBackground && hasScale && hasScreen && hasCabinet;

  // Hide the strip once the user is well past onboarding.
  if (allDone) return null;

  const steps = [
    { idx: 1, label: 'Загрузи фон', done: hasBackground },
    { idx: 2, label: 'Задай масштаб', done: hasScale },
    { idx: 3, label: 'Поставь экран', done: hasScreen },
    { idx: 4, label: 'Задай кабинеты', done: hasCabinet },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
      {steps.map((s, i) => (
        <div key={s.idx} className="flex shrink-0 items-center gap-2 text-[11px]">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
              s.done
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {s.done ? <Check className="h-3 w-3" /> : s.idx}
          </div>
          <span className={s.done ? 'text-slate-400 line-through' : 'text-slate-200'}>
            {s.label}
          </span>
          {i < steps.length - 1 ? <span className="text-slate-600">→</span> : null}
        </div>
      ))}
    </div>
  );
};

export default WorkflowSteps;
