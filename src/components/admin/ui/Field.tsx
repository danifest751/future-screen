import {
  cloneElement,
  isValidElement,
  type AriaAttributes,
  type ReactNode,
  useId,
} from 'react';

export type FieldProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  required?: boolean;
  /** ID для связи label с input через htmlFor */
  fieldId?: string;
};

type FieldControlProps = {
  id?: string;
  hasError?: boolean;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  'aria-invalid'?: AriaAttributes['aria-invalid'];
};

const mergeDescribedBy = (
  current: AriaAttributes['aria-describedby'],
  next: string | undefined,
) => [current, next].filter(Boolean).join(' ') || undefined;

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
  const childId = isValidElement<FieldControlProps>(children) ? children.props.id : undefined;
  const id = fieldId || childId || generatedId;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const childWithProps = isValidElement<FieldControlProps>(children)
    ? cloneElement(children, {
        id,
        'aria-describedby': mergeDescribedBy(children.props['aria-describedby'], describedBy),
        'aria-invalid': error ? true : children.props['aria-invalid'],
        ...(typeof children.type !== 'string' && error ? { hasError: true } : {}),
      })
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
