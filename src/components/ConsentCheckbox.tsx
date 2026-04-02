import { memo } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  className?: string;
};

export const ConsentCheckbox = memo(function ConsentCheckbox({ checked, onChange, error, className = '' }: Props) {
  return (
    <div className={className}>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
        />
        <span className="text-sm text-slate-400">
          Нажимая кнопку «Отправить», я даю согласие на обработку персональных данных в соответствии с{' '}
          <Link to="/privacy" target="_blank" className="text-brand-400 hover:text-brand-300 underline">
            Политикой конфиденциальности
          </Link>
        </span>
      </label>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});
