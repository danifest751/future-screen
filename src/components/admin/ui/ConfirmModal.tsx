import { type ReactNode, useMemo, useState } from 'react';
import Button from './Button';

export type ConfirmModalProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const confirmVariant = useMemo(() => (danger ? 'danger' : 'primary'), [danger]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (submitting || confirmDisabled) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="space-y-2">
          <div className="text-lg font-semibold text-white">{title}</div>
          {description ? <div className="text-sm text-slate-400">{description}</div> : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={submitting}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            size="md"
            loading={submitting}
            disabled={confirmDisabled}
            onClick={() => void handleConfirm()}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

