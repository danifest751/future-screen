import { type ReactNode, useMemo, useState } from 'react';
import Button from './Button';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

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

// Внутренний компонент с логикой
function ConfirmModalContent({
  title,
  description,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: Omit<ConfirmModalProps, 'open'>) {
  const [submitting, setSubmitting] = useState(false);

  // Ловушка фокуса
  const { containerRef } = useFocusTrap({
    active: true,
    onEscape: onCancel,
  });

  const confirmVariant = useMemo(() => (danger ? 'danger' : 'primary'), [danger]);

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

  const titleId = 'confirm-modal-title';
  const descId = description ? 'confirm-modal-desc' : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="space-y-2">
          <div id={titleId} className="text-lg font-semibold text-white">
            {title}
          </div>
          {description ? (
            <div id={descId} className="text-sm text-slate-400">
              {description}
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={submitting}
            aria-label={cancelText}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            size="md"
            loading={submitting}
            disabled={confirmDisabled}
            onClick={() => void handleConfirm()}
            aria-label={confirmText}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Модальное окно подтверждения с поддержкой доступности.
 * Реализует ловушку фокуса, ARIA-атрибуты и управление с клавиатуры.
 */
export default function ConfirmModal(props: ConfirmModalProps) {
  if (!props.open) {
    return null;
  }

  return <ConfirmModalContent {...props} />;
}
