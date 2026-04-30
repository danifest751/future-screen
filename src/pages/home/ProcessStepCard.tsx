import { useEditableBinding } from '../../hooks/useEditableBinding';
import type { HomeProcessStep } from '../../lib/content/homeProcess';

interface ProcessStepCardProps {
  step: HomeProcessStep;
  index: number;
  onSaveStep: (next: HomeProcessStep) => Promise<void>;
}

export const ProcessStepCard = ({ step, index, onSaveStep }: ProcessStepCardProps) => {
  const numEdit = useEditableBinding({
    value: step.num,
    onSave: (next) => onSaveStep({ ...step, num: next }),
    label: `Process step ${index + 1} — number`,
  });
  const titleEdit = useEditableBinding({
    value: step.title,
    onSave: (next) => onSaveStep({ ...step, title: next }),
    label: `Process step ${index + 1} — title`,
  });
  const descEdit = useEditableBinding({
    value: step.desc,
    onSave: (next) => onSaveStep({ ...step, desc: next }),
    label: `Process step ${index + 1} — description`,
    kind: 'multiline',
  });
  return (
    <div className="card relative h-full text-center">
      <div
        className="font-display mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
        style={{ background: 'var(--accent-gradient)', boxShadow: 'var(--glow)' }}
      >
        <span {...numEdit.bindProps}>{numEdit.value}</span>
      </div>
      <h3 className="font-display mb-2 text-lg font-semibold text-white">
        <span {...titleEdit.bindProps}>{titleEdit.value}</span>
      </h3>
      <p className="text-sm leading-relaxed text-gray-400">
        <span {...descEdit.bindProps}>{descEdit.value}</span>
      </p>
    </div>
  );
};
