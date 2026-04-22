import { useState } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useActiveScene } from './state/VisualLedContext';

/**
 * Compact workflow strip that guides a first-time user through the
 * correct order of operations. Each stage lights up green when its
 * condition is met. When all four are done, the strip collapses to a
 * tiny completion badge that can be re-expanded.
 */
const WorkflowSteps = () => {
  const scene = useActiveScene();
  const [collapsed, setCollapsed] = useState(false);

  const hasBackground = Boolean(scene.activeBackgroundId);
  const hasScale = Boolean(scene.scaleCalib);
  const hasScreen = scene.elements.length > 0;
  const hasCabinet = scene.elements.some((el) => el.cabinetPlan);
  const doneCount = [hasBackground, hasScale, hasScreen, hasCabinet].filter(Boolean).length;
  const allDone = doneCount === 4;

  const steps = [
    { idx: 1, label: 'Загрузи фон', done: hasBackground },
    { idx: 2, label: 'Задай масштаб', done: hasScale },
    { idx: 3, label: 'Поставь экран', done: hasScreen },
    { idx: 4, label: 'Задай кабинеты', done: hasCabinet },
  ];

  if (allDone && collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200 hover:border-emerald-400/50"
        aria-label="Развернуть прогресс"
      >
        <Check className="h-3 w-3" />
        Все шаги пройдены
        <ChevronDown className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2">
      {steps.map((s, i) => (
        <div key={s.idx} className="flex shrink-0 items-center gap-2 text-[11px]">
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
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
      <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">
        {doneCount}/4
      </span>
      {allDone ? (
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="shrink-0 rounded-md p-1 text-slate-500 hover:bg-white/5 hover:text-white"
          aria-label="Свернуть прогресс"
          title="Свернуть"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
};

export default WorkflowSteps;
