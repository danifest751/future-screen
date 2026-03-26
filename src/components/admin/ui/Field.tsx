import { type ReactNode, useId } from 'react';

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  required?: boolean;
  /** ID для связи label с input через htmlFor */
  fieldId?: string;
};

/**
 * Компонент Field — обёртка для форм-полей с поддержкой доступности.
 * Генерирует уникальный ID для связи label с input/textarea/select.
 *
 * @example
 * <Field label="Email" required error={errors.email}>
 *   <Input {...fieldProps} />
 * </Field>
 */
export default function Field({ label, hint, error, children, required, fieldId }: FieldProps) {
  const generatedId = useId();
  const id = fieldId || generatedId;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  // Собираем aria-describedby из hint и error
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  // Клонируем children и добавляем ID + aria-атрибуты
  const childWithProps = describedBy
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((child: ReactNode) => {
        if (!child || typeof child !== 'object') return child;
        return (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child as any).type &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeof (child as any).type !== 'string' &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          typeof (child as any).type === 'function' &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child as any).props
        )
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { ...(child as any), props: { ...(child as any).props, id, 'aria-describedby': describedBy } }
          : child;
      })(children)
    : children;

  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={id} className="block text-sm text-slate-200">
          {label}
          {required ? <span className="ml-1 text-red-300" aria-hidden="true">*</span> : null}
          {required ? <span className="sr-only"> (обязательное поле)</span> : null}
        </label>
      ) : null}
      {childWithProps}
      {hint ? (
        <div id={hintId} className="text-xs text-slate-400">
          {hint}
        </div>
      ) : null}
      {error ? (
        <div
          id={errorId}
          className="mt-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
