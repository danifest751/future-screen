import {
  CircleDot,
  DoorOpen,
  LayoutTemplate,
  Monitor,
  Move,
  PenLine,
  SeparatorVertical,
  Square,
} from 'lucide-react';

export type FloorPlanTool =
  | 'select'
  | 'wall'
  | 'partition'
  | 'door'
  | 'window'
  | 'column'
  | 'stage';

interface FloorPlanToolbarProps {
  activeTool: FloorPlanTool;
  onToolChange: (tool: FloorPlanTool) => void;
}

const tools: { id: FloorPlanTool; label: string; icon: React.ReactNode }[] = [
  { id: 'select', label: 'Выбор', icon: <Move className="h-3.5 w-3.5" /> },
  { id: 'wall', label: 'Стена', icon: <PenLine className="h-3.5 w-3.5" /> },
  { id: 'partition', label: 'Перегородка', icon: <SeparatorVertical className="h-3.5 w-3.5" /> },
  { id: 'door', label: 'Дверь', icon: <DoorOpen className="h-3.5 w-3.5" /> },
  { id: 'window', label: 'Окно', icon: <Square className="h-3.5 w-3.5" /> },
  { id: 'column', label: 'Колонна', icon: <CircleDot className="h-3.5 w-3.5" /> },
  { id: 'stage', label: 'Сцена', icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
];

const FloorPlanToolbar = ({ activeTool, onToolChange }: FloorPlanToolbarProps) => {
  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-white/10 bg-slate-900/80 p-1 shadow-xl">
      {tools.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onToolChange(t.id)}
          className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] transition ${
            activeTool === t.id
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
          title={t.label}
        >
          {t.icon}
          <span className="hidden lg:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
};

export default FloorPlanToolbar;
