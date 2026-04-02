import { memo, type ReactNode } from 'react';
import Button from './Button';

export type EmptyStateProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: {
    text: string;
    onClick: () => void;
  };
};

const EmptyState = memo(function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-8 text-center">
      {icon ? <div className="text-3xl">{icon}</div> : null}
      <div className="text-base font-semibold text-white">{title}</div>
      {description ? <div className="text-sm text-slate-400">{description}</div> : null}
      {action ? (
        <div>
          <Button variant="secondary" onClick={action.onClick}>
            {action.text}
          </Button>
        </div>
      ) : null}
    </div>
  );
});

export default EmptyState;

